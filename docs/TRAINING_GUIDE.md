# BillSnap - Guía de Entrenamiento de IA Nativa

## 📋 Resumen de Modelos Disponibles

| Modelo | Tamaño | Precisión | Velocidad | GPU Requerida | Mejor para |
|--------|--------|-----------|-----------|---------------|------------|
| **PaddleOCR** | ~20MB | 92% | Rápida (2-5s) | No | Facturas, documentos |
| **TrOCR Small** | ~250MB | 89% | Media (3-8s) | Recomendada | Texto impreso limpio |
| **TrOCR Base** | ~600MB | 94% | Lenta (5-15s) | Sí | Texto mixto |
| **Nougat** | ~1GB | 96% | Muy lenta (10-30s) | Sí | Documentos complejos |
| **Tesseract** | ~20MB | 85% | Media (3-10s) | No | Fallback universal |

---

## 🎯 Estrategia Recomendada para BillSnap

### Opción 1: PaddleOCR (RECOMENDADA para empezar)
- **Por qué**: Pequeño (~20MB), rápido, buena precisión, funciona en cualquier dispositivo
- **Cómo**: Se ejecuta en el navegador via ONNX Runtime Web
- **Ventaja**: No necesita GPU, funciona offline

### Opción 2: TrOCR Small (Balance ideal)
- **Por qué**: Buena precisión (89%), tamaño manejable (~250MB)
- **Cómo**: Se carga via transformers.js desde CDN de HuggingFace
- **Ventaja**: Se cachea después de la primera descarga

### Opción 3: Modelo personalizado fine-tuned (MÁXIMA PRECISIÓN)
- **Por qué**: Entrenado específicamente en facturas españolas/europeas
- **Precisión esperada**: 95-98%
- **Cómo**: Fine-tune de TrOCR o Donut con dataset propio

---

## 🏋️ Cómo Entrenar un Modelo Personalizado

### Paso 1: Recopilar Dataset

#### Fuentes de datos:
1. **Facturas propias** (mejor opción): Escanear/digitalizar 200-500 facturas reales
2. **Datasets públicos**:
   - [RVL-CDIP](https://www.cs.cmu.edu/~aharley/rvl-cdip/): 400k documentos
   - [FUNSD](https://guillaumejaume.github.io/FUNSD/): Formularios anotados
   - [SROIE](https://rrc.cvc.uab.es/?ch=13): Recibos
   - [InvoiceNet](https://github.com/naiveHobo/InvoiceNet): Facturas anotadas

3. **Generar datos sintéticos**:
   ```python
   # Generar facturas falsas con variaciones
   from faker import Faker
   from PIL import Image, ImageDraw, ImageFont
   
   fake = Faker(['es_ES', 'en_US'])
   
   for i in range(1000):
       invoice = {
           'number': f"FACT-{fake.random_number(digits=6)}",
           'date': fake.date_between(start_date='-2y'),
           'issuer': fake.company(),
           'nif': fake.bothify('??#######?'),
           'total': round(fake.pyfloat(min_value=10, max_value=10000), 2),
           'iva': random.choice([21, 10, 4, 0])
       }
       # Render invoice image
       render_invoice(invoice, f"data/train/{i}.png")
   ```

### Paso 2: Anotar el Dataset

#### Formato requerido para fine-tuning:

**Para TrOCR** (reconocimiento de texto):
```json
{"file_name": "invoice_001.png", "text": "FACTURA Nº: FACT-2024-001\nFecha: 15/03/2024\nEmpresa S.L.\nNIF: B12345678\nBase imponible: 1.000,00 €\nIVA 21%: 210,00 €\nTotal: 1.210,00 €"}
```

**Para Donut** (extracción estructurada):
```json
{
    "file_name": "invoice_001.png",
    "ground_truth": {
        "gt_parse": {
            "invoice_number": "FACT-2024-001",
            "date": "2024-03-15",
            "seller": {"name": "Empresa S.L.", "tax_id": "B12345678"},
            "total": "1210.00",
            "vat": "210.00",
            "net": "1000.00"
        }
    }
}
```

#### Herramientas de anotación:
- **Label Studio** (gratis, open source): https://labelstud.io/
- **CVAT** (gratis): https://cvat.ai/
- **UBIAI** (especializado en documentos): https://ubiai.tools/
- **Doccano** (gratis): https://github.com/doccano/doccano

### Paso 3: Fine-tuning con Google Colab (GRATIS)

```python
# === NOTEBOOK DE FINE-TUNING ===
# Ejecutar en Google Colab con GPU (Runtime > Change runtime type > GPU)

# 1. Instalar dependencias
!pip install transformers datasets torch torchvision accelerate

# 2. Cargar modelo base
from transformers import TrOCRProcessor, VisionEncoderDecoderModel

processor = TrOCRProcessor.from_pretrained("microsoft/trocr-small-printed")
model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-small-printed")

# 3. Preparar dataset
from datasets import load_dataset
from torch.utils.data import Dataset
from PIL import Image

class InvoiceDataset(Dataset):
    def __init__(self, data_dir, processor, max_length=128):
        self.data = self.load_data(data_dir)
        self.processor = processor
        self.max_length = max_length
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        item = self.data[idx]
        image = Image.open(item['file_name']).convert('RGB')
        text = item['text']
        
        # Process image
        pixel_values = processor(image, return_tensors='pt').pixel_values
        
        # Tokenize text
        labels = processor.tokenizer(
            text, 
            padding='max_length', 
            max_length=self.max_length
        ).input_ids
        labels = [l if l != processor.tokenizer.pad_token_id else -100 for l in labels]
        
        return {
            'pixel_values': pixel_values.squeeze(),
            'labels': torch.tensor(labels)
        }

# 4. Configurar entrenamiento
from transformers import Seq2SeqTrainer, Seq2SeqTrainingArguments

training_args = Seq2SeqTrainingArguments(
    output_dir="./billsnap-ocr",
    num_train_epochs=30,
    per_device_train_batch_size=8,
    per_device_eval_batch_size=8,
    learning_rate=5e-5,
    warmup_steps=500,
    weight_decay=0.01,
    logging_steps=100,
    save_steps=500,
    evaluation_strategy="epoch",
    save_total_limit=3,
    predict_with_generate=True,
    fp16=True,  # Mixed precision for speed
)

# 5. Entrenar
trainer = Seq2SeqTrainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=processor.feature_extractor,
)

trainer.train()

# 6. Guardar modelo
model.save_pretrained("./billsnap-ocr-final")
processor.save_pretrained("./billsnap-ocr-final")

# 7. Convertir a ONNX para navegador
!pip install optimum
from optimum.onnxruntime import ORTModelForVision2Seq

ort_model = ORTModelForVision2Seq.from_pretrained(
    "./billsnap-ocr-final", 
    export=True
)
ort_model.save_pretrained("./billsnap-ocr-onnx")
```

### Paso 4: Convertir a Formato Web

```python
# Convertir modelo ONNX a formato para navegador
import json
import shutil

# 1. Crear directorio para web
os.makedirs("web_model", exist_ok=True)

# 2. Copiar archivos ONNX
shutil.copy("billsnap-ocr-onnx/model.onnx", "web_model/")

# 3. Crear config.json para transformers.js
config = {
    "model_type": "trocr",
    "vocab_size": processor.tokenizer.vocab_size,
    "decoder_start_token_id": model.config.decoder_start_token_id,
    "eos_token_id": processor.tokenizer.eos_token_id,
    "pad_token_id": processor.tokenizer.pad_token_id,
    "max_length": 128,
    "image_size": [384, 384]
}

with open("web_model/config.json", "w") as f:
    json.dump(config, f)

# 4. Subir a HuggingFace Hub
from huggingface_hub import HfApi
api = HfApi()
api.upload_folder(
    folder_path="web_model",
    repo_id="tu-usuario/billsnap-ocr-es",
    repo_type="model"
)
```

### Paso 5: Integrar en BillSnap

```javascript
// En src/js/ai/native-ai.js, añadir tu modelo:
models: {
    billsnap_custom: {
        id: 'billsnap_custom',
        name: 'BillSnap Custom',
        modelId: 'tu-usuario/billsnap-ocr-es', // Tu modelo en HuggingFace
        accuracy: 0.96,
        size: '~300MB'
    }
}
```

---

## 📊 Datasets Públicos para Facturas

| Dataset | Idioma | Tamaño | Formato | Link |
|---------|--------|--------|---------|------|
| **SROIE** | Inglés | 626 imágenes | Recibos | [Link](https://rrc.cvc.uab.es/?ch=13) |
| **FUNSD** | Inglés | 199 imágenes | Formularios | [Link](https://guillaumejaume.github.io/FUNSD/) |
| **RVL-CDIP** | Inglés | 400k | Documentos | [Link](https://www.cs.cmu.edu/~aharley/rvl-cdip/) |
| **InvoiceNet** | Inglés | 1,500 | Facturas | [Link](https://github.com/naiveHobo/InvoiceNet) |
| **DocVQA** | Multi | 50k | Documentos | [Link](https://www.docvqa.org/) |
| **SynthDoG** | Multi | Sintético | Documentos | Generado |

---

## ⚡ Rendimiento Esperado

### Sin fine-tuning (modelos pre-entrenados):
- **Tesseract**: ~85% precisión en facturas limpias
- **TrOCR Small**: ~89% precisión
- **PaddleOCR**: ~92% precisión

### Con fine-tuning (200+ facturas anotadas):
- **TrOCR fine-tuned**: ~95% precisión
- **Donut fine-tuned**: ~97% precisión (extracción estructurada)

### Con fine-tuning avanzado (500+ facturas):
- **Modelo custom**: ~98% precisión

---

## 🔧 Checklist de Entrenamiento

- [ ] Recopilar 200-500 facturas (propias o públicas)
- [ ] Anotar facturas con Label Studio o UBIAI
- [ ] Dividir dataset: 80% train, 10% validation, 10% test
- [ ] Fine-tune en Google Colab (gratis con GPU)
- [ ] Evaluar métricas (CER < 5% objetivo)
- [ ] Convertir a ONNX
- [ ] Subir a HuggingFace Hub
- [ ] Integrar en BillSnap
- [ ] Test con facturas reales
- [ ] Optimizar tamaño del modelo (<500MB objetivo)

---

## 💰 Costes de Entrenamiento

| Método | Coste | Tiempo | GPU |
|--------|-------|--------|-----|
| **Google Colab Free** | 0€ | 2-4 horas | T4 |
| **Google Colab Pro** | 10€/mes | 1-2 horas | V100/A100 |
| **RunPod** | ~0.5€/hora | 1-2 horas | RTX 3090 |
| **Vast.ai** | ~0.3€/hora | 1-2 horas | Varios |
| **Lambda Cloud** | ~1€/hora | 1 hora | A100 |

**Recomendación**: Empezar con Google Colab Free (0€) para probar, y solo pagar si necesitas más velocidad.
