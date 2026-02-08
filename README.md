# Cubo NxN — Plan Detallado de Mejoras

Este documento describe un plan de mejoras organizado por áreas. Cada bloque incluye objetivos, entregables y notas técnicas para facilitar la implementación incremental.

## 1. Experiencia de Usuario (UX)

**Objetivos**
- Reducir fricción al iniciar un solve.
- Hacer la interfaz más clara en pantallas pequeñas.
- Permitir personalización rápida sin saturar el layout.

**Entregables**
1. **Modo Focus**
   - Oculta paneles y deja solo cubo + timer.
   - Toggle en Configuración y atajo de teclado.
2. **Layout responsive optimizado**
   - Panel lateral colapsable en móviles.
   - Controles agrupados en “drawer” inferior.
3. **Panel de Atajos con presets**
   - Presets: csTimer, WCA, Custom.
   - Editor visual de mapeo de teclas.

**Notas técnicas**
- Añadir breakpoint `max-width: 760px` con reflow completo.
- Guardar preferencias de UI en `localStorage`.

---

## 2. Scramble y Entrenamiento

**Objetivos**
- Scrambles oficiales sin dependencia de CDN.
- Mejoras para entrenamiento específico.

**Entregables**
1. **Scramble WCA offline (2x2–7x7)**
   - Implementación local de generadores o precomputed patterns.
2. **Selector de evento WCA**
   - UI para elegir `222, 333, 444...`.
3. **Trainer por fase**
   - OLL/PLL/F2L preset scrambles.

**Notas técnicas**
- Mantener compatibilidad con scrambles actuales.
- Permitir fallback a CDN si existe red.

---

## 3. Timer y Sesiones

**Objetivos**
- Métricas completas (WCA) y análisis de progreso.

**Entregables**
1. **DNF / +2**
   - Toggle en solve individual.
   - Ajuste automático de AO5/AO12.
2. **Exportar/Importar sesiones**
   - JSON y CSV.
3. **Comparativas**
   - Gráfico de tendencia (line chart).

**Notas técnicas**
- `localStorage` puede migrar a `indexedDB` si crecen los datos.

---

## 4. Replay y Reconstrucción

**Objetivos**
- Mejorar precisión y utilidad del replay.

**Entregables**
1. **Timeline visual**
   - Barra con ticks por movimiento.
   - Click para saltar a un movimiento.
2. **Etiquetas por fase**
   - F2L/OLL/PLL tags manuales o automáticos.
3. **Exportar reconstrucción**
   - Texto con notación y timestamps.

**Notas técnicas**
- Guardar movimientos como `{label, t, duration, axis, layers, turns}`.

---

## 5. Render y Controles

**Objetivos**
- Mejor desempeño en NxN grandes y mejor control táctil.

**Entregables**
1. **InstancedMesh para cubies**
   - Mejor rendimiento en 8x8+.
2. **Controles touch**
   - Swipe para capas, pinch zoom.
3. **Calidad de render**
   - Toggle sombras/antialias.

**Notas técnicas**
- Para instancing, separar “stickers” en geometría secundaria.

---

## 6. Accesibilidad

**Objetivos**
- Facilitar lectura y uso para más usuarios.

**Entregables**
1. **Modo alto contraste**
2. **Escala de texto global**
3. **Navegación por teclado total**

---

## Fases sugeridas

**Fase 1 (rápido impacto)**
- Modo Focus
- Selector de evento WCA
- DNF / +2

**Fase 2 (valor medio)**
- Exportar/Importar sesiones
- Timeline de replay
- Controles touch

**Fase 3 (mayor esfuerzo)**
- Scramble WCA offline
- InstancedMesh
- Etiquetas automáticas por fase

---

## Consideraciones

- Mantener todo en HTML/CSS/JS plano para facilidad de despliegue.
- Evitar dependencias pesadas salvo que aporten mejoras claras.
- Toda nueva opción debe persistir en `localStorage`.
