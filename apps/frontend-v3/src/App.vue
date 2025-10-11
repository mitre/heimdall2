<template>
  <UApp>
    <div class="min-h-screen p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-4">Heimdall v3 - Development</h1>
        <p class="text-muted mb-6">Vue 3 + Nuxt UI + Better Auth + Apache ECharts</p>

        <div class="space-y-4">
          <UButton @click="testBackend" color="primary">
            Test Backend Connection
          </UButton>

          <UCard v-if="data">
            <template #header>
              <h3 class="text-lg font-semibold">Backend Response</h3>
            </template>
            <pre class="text-sm overflow-auto">{{ JSON.stringify(data, null, 2) }}</pre>
          </UCard>

          <UCard v-if="error" color="error">
            <template #header>
              <h3 class="text-lg font-semibold">Error</h3>
            </template>
            <p>{{ error }}</p>
          </UCard>
        </div>

        <RouterView class="mt-8" />
      </div>
    </div>
  </UApp>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const data = ref(null)
const error = ref('')

async function testBackend() {
  try {
    error.value = ''
    const response = await axios.get('/api/evaluations')
    data.value = response.data
  } catch (err: any) {
    error.value = err.message
    data.value = null
  }
}
</script>
