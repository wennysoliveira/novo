<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Excluir Inscrições (Temporário)</h1>
            <p class="text-sm text-gray-600">Use filtros para localizar dados de teste e remover em lote</p>
          </div>
          <NuxtLink to="/admin" class="btn-secondary">← Voltar</NuxtLink>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Criado a partir de</label>
            <input type="datetime-local" v-model="filters.createdFrom" class="form-input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Criado até</label>
            <input type="datetime-local" v-model="filters.createdTo" class="form-input" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">CPF contém</label>
            <input type="text" v-model="filters.cpfLike" class="form-input" placeholder="ex.: temp- ou 000" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-mail contém</label>
            <input type="text" v-model="filters.emailLike" class="form-input" placeholder="ex.: @example.com" />
          </div>
        </div>
        <div class="mt-4 flex gap-3">
          <button class="btn-secondary" @click="applyFilters">Aplicar filtros</button>
          <button class="btn-secondary" @click="clearFilters">Limpar</button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">Pré-visualização ({{ filtered.length }})</h3>
          <div class="flex items-center gap-3">
            <label class="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" :checked="allSelected" @change="toggleSelectAll($event)" /> Selecionar todos
            </label>
            <button :disabled="selectedIds.size===0 || deleting" class="btn-danger" @click="confirmDelete">
              <span v-if="deleting">Excluindo...</span>
              <span v-else>Excluir selecionados ({{ selectedIds.size }})</span>
            </button>
          </div>
        </div>

        <div v-if="loading" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-500">Carregando...</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3"></th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criado em</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="it in filtered" :key="it.id">
                <td class="px-6 py-3">
                  <input type="checkbox" :checked="selectedIds.has(it.id)" @change="toggle(it.id, $event)" />
                </td>
                <td class="px-6 py-3 text-sm text-gray-900">{{ it.nomeCompleto }}</td>
                <td class="px-6 py-3 text-sm text-gray-900">{{ it.cpf }}</td>
                <td class="px-6 py-3 text-sm text-gray-900">{{ it.email }}</td>
                <td class="px-6 py-3 text-sm text-gray-500">{{ formatDateTime(it.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ title: 'Excluir Inscrições (Temporário)' })

const loading = ref(false)
const deleting = ref(false)
const all: any = ref([])
const filtered: any = ref([])
const selectedIds = ref<Set<string>>(new Set())

const filters = ref({
  createdFrom: '',
  createdTo: '',
  cpfLike: '',
  emailLike: ''
})

const allSelected = computed(() => filtered.value.length > 0 && filtered.value.every((i: any) => selectedIds.value.has(i.id)))

const loadAll = async () => {
  loading.value = true
  try {
    const res: any = await $fetch('/api/admin/inscricoes', { method: 'GET', query: { page: 1, limit: 1000 }, credentials: 'include' })
    all.value = res?.data || []
    applyFilters()
  } catch (e) {
    console.error('Erro ao carregar inscrições:', e)
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  const cf = filters.value
  const f = (it: any) => {
    let ok = true
    if (cf.createdFrom) ok = ok && new Date(it.createdAt) >= new Date(cf.createdFrom)
    if (cf.createdTo) ok = ok && new Date(it.createdAt) <= new Date(cf.createdTo)
    if (cf.cpfLike) ok = ok && String(it.cpf || '').toLowerCase().includes(cf.cpfLike.toLowerCase())
    if (cf.emailLike) ok = ok && String(it.email || '').toLowerCase().includes(cf.emailLike.toLowerCase())
    return ok
  }
  filtered.value = all.value.filter(f)
  // Manter seleção apenas dos itens visíveis
  selectedIds.value = new Set(filtered.value.filter((i: any) => selectedIds.value.has(i.id)).map((i: any) => i.id))
}

const clearFilters = () => {
  filters.value = { createdFrom: '', createdTo: '', cpfLike: '', emailLike: '' }
  applyFilters()
}

const toggle = (id: string, ev: Event) => {
  const checked = (ev.target as HTMLInputElement).checked
  if (checked) selectedIds.value.add(id)
  else selectedIds.value.delete(id)
}

const toggleSelectAll = (ev: Event) => {
  const checked = (ev.target as HTMLInputElement).checked
  if (checked) filtered.value.forEach((i: any) => selectedIds.value.add(i.id))
  else selectedIds.value.clear()
}

const confirmDelete = async () => {
  if (selectedIds.value.size === 0) return
  if (!confirm(`Excluir ${selectedIds.value.size} inscrições selecionadas? Esta ação é irreversível.`)) return
  deleting.value = true
  try {
    const body = { ids: Array.from(selectedIds.value) }
    const resp: any = await $fetch('/api/admin/inscricoes', { method: 'DELETE', body, credentials: 'include' })
    console.log('Exclusão em lote:', resp)
    await loadAll()
    selectedIds.value.clear()
    alert(`Excluídas ${resp?.deleted ?? 0} inscrições (de ${resp?.matched ?? 0} encontradas).`)
  } catch (e: any) {
    console.error('Erro ao excluir:', e)
    alert(e?.data?.statusMessage || e?.message || 'Erro ao excluir inscrições')
  } finally {
    deleting.value = false
  }
}

const formatDateTime = (d: string) => new Date(d).toLocaleString('pt-BR')

onMounted(loadAll)
</script>


