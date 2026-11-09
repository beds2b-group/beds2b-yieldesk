<!-- Copyright (C) 2026 Beds2B. Generado por zammad:sync desde beds2b-softphone: no editar aquí. Licencia MIT (LICENSE de beds2b-softphone). Se incluye en esta versión modificada de Zammad, distribuida bajo AGPL-3.0. Ver MODIFICATIONS.md. -->

<script setup lang="ts">
import { computed } from 'vue'

import { ICONS, type IconName } from './icons.ts'

const props = withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 18 })

const shapes = computed(() => ICONS[props.name])
</script>

<template>
  <svg
    class="sp-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <component :is="shape.tag" v-for="(shape, index) in shapes" :key="index" v-bind="shape.attrs" />
  </svg>
</template>
