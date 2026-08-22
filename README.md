# Helpful Support — Software & Science Field Library

Biblioteca práctica y buscable para convertir ideas de software, datos y ciencia en sistemas operables.

## Qué resuelve

Este repositorio no es otra colección de enlaces. Cada tema conecta cinco piezas:

1. **Concepto** — qué problema resuelve.
2. **Decisión** — cuándo usarlo y cuándo no.
3. **Contrato** — entradas, salidas, errores y seguridad.
4. **Ejemplo ejecutable** — código pequeño y comprobable.
5. **Cierre** — prueba, observabilidad y criterio de éxito.

La primera versión incluye un RAG local sin costo basado en Markdown + SQLite FTS5, un catálogo de familias de APIs y clientes HTTP reutilizables.

## Inicio rápido

Requiere Python 3.11+ y no necesita dependencias para el núcleo.

```bash
python -m helpful_support.cli doctor
python -m helpful_support.cli index
python -m helpful_support.cli search "webhooks idempotencia"
python -m helpful_support.cli api-family geospatial
python -m unittest discover -s tests -v
```

En Windows PowerShell:

```powershell
py -m helpful_support.cli doctor
py -m helpful_support.cli index
py -m helpful_support.cli search "priorización de leads"
```

## Mapa de la biblioteca

- [Mapa de aprendizaje](docs/00_learning_map.md)
- [Familias de APIs](docs/10_api_families.md)
- [Arquitectura y entrega](docs/20_software_delivery.md)
- [Data Science operable](docs/30_applied_data_science.md)
- [RAG y sistemas de conocimiento](docs/40_rag_systems.md)
- [Seguridad, privacidad y costos](docs/50_safety_costs.md)
- [Mapa hacia tus proyectos](docs/60_project_adoption.md)
- [Checklist de cierre](docs/70_definition_of_done.md)
- [Catálogo estructurado](catalog/api_families.json)

## Arquitectura

```text
docs/*.md + catalog/*.json
             |
             v
    scripts/build_index.py
             |
             v
      data/library.db
             |
             v
helpful_support.cli search / api-family
```

El índice generado se excluye de Git: siempre puede reconstruirse desde fuentes versionadas.

## Principios

- Empezar con la opción más simple que permita medir.
- Separar datos, lógica de negocio, modelo e interfaz.
- Registrar evidencia antes de automatizar decisiones.
- Diseñar reintentos, idempotencia y límites desde el primer webhook.
- Nunca guardar secretos ni datos personales en Git.
- Un proyecto termina cuando existe evidencia de uso y resultado, no cuando “corre”.

## Próxima evolución

La búsqueda lexical es el baseline auditable. Solo conviene añadir embeddings cuando exista evidencia de consultas que FTS5 no resuelva. El contrato de documentos permite migrar posteriormente a pgvector, Qdrant u otro vector store sin reescribir la biblioteca.

## Licencia

Uso educativo y de soporte a proyectos. Ver [LICENSE](LICENSE).
