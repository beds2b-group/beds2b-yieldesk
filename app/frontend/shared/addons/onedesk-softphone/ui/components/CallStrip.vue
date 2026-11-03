<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Se distribuye bajo AGPL-3.0 como parte de esta versión modificada de Zammad. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
// Franja con el interlocutor y el tiempo, como la de la pantalla de transferencia del diseño.
defineProps<{ peer: string; detail: string; live: boolean }>()
</script>

<template>
  <div class="sp-call-strip">
    <span class="sp-call-strip__dot" :class="{ 'sp-call-strip__dot--live': live }" />
    <span class="sp-call-strip__peer" data-testid="call-peer">{{ peer }}</span>
    <span class="sp-call-strip__detail" data-testid="call-detail">{{ detail }}</span>
  </div>
</template>
