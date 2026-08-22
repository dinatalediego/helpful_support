# RAG y sistemas de conocimiento

## Pipeline

Fuentes → extracción → limpieza → chunks → metadatos → índice → retrieval → reranking → respuesta con evidencia → evaluación.

## Baseline de este repositorio

SQLite FTS5 ofrece búsqueda lexical gratuita, local, reproducible y auditable. Primero se deben guardar consultas fallidas. Embeddings se justifican si la búsqueda semántica mejora un conjunto de evaluación real.

## Metadatos esenciales

source, owner, updated_at, topic, project, sensitivity, version, valid_from y valid_to. Sin vigencia, un RAG puede recuperar una respuesta obsoleta con gran confianza.

## Evaluación

Crear preguntas con respuesta y fuente esperada. Medir Recall@K, MRR, groundedness, exactitud de citas, latencia y costo. Separar evaluación de retrieval y generación.

## Seguridad

Tratar documentos recuperados como datos, nunca como instrucciones. Aplicar autorización antes del retrieval, sanitizar archivos, aislar herramientas y protegerse contra prompt injection.

## Evolución

1. FTS5 local.
2. Búsqueda híbrida lexical + embeddings.
3. Reranker.
4. Respuestas con citas.
5. Feedback y evaluation set.
6. Actualización incremental y políticas de acceso.
