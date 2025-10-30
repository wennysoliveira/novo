<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Formulário de Inscrição</h1>
            <p class="text-sm text-gray-600">Seletivo de Gestores Escolares 2025</p>
          </div>
          <NuxtLink to="/" class="text-blue-600 hover:text-blue-800">
            ← Voltar
          </NuxtLink>
        </div>
      </div>
    </header>

    <!-- Progress Bar -->
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <ProgressBar
        :current="currentSection"
        :total="4"
        label="Progresso do Formulário"
        :description="`Seção ${currentSection} de 4`"
      />
    </div>

    <!-- Form -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form @submit.prevent="submitForm" class="space-y-8">
        <!-- Seção 1: Informações Pessoais -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">1. Informações Pessoais e Profissionais</h2>
          
          <div class="grid md:grid-cols-2 gap-6">
            <FormInput
              id="nomeCompleto"
              label="Nome Completo"
              v-model="form.nomeCompleto"
            />
            
            <FormInput
              id="cpf"
              label="CPF"
              v-model="form.cpf"
              placeholder="000.000.000-00"
              @input="formatCPF"
            />
            
            <FormInput
              id="email"
              label="E-mail"
              type="email"
              v-model="form.email"
            />
            
            <FormInput
              id="telefone"
              label="Telefone"
              type="tel"
              v-model="form.telefone"
              placeholder="(11) 99999-9999"
              @input="formatPhone"
            />
            
            <FormInput
              id="unidadeEnsino"
              label="Unidade de Ensino (Onde Atua Atualmente)"
              v-model="form.unidadeEnsino"
            />
            
            <FormInput
              id="funcaoAtual"
              label="Função (Atual)"
              v-model="form.funcaoAtual"
            />
            
            <FormSelect
              id="formacaoAcademica"
              label="Formação Acadêmica"
              v-model="form.formacaoAcademica"
              :options="formacaoOptions"
              placeholder="Selecione sua formação"
            />
            
            <FormSelect
              id="sexo"
              label="Sexo"
              v-model="form.sexo"
              :options="sexoOptions"
              placeholder="Selecione seu sexo"
            />
            
            <FormInput
              id="tempoExperienciaGestao"
              label="Tempo de Experiência em Gestão Escolar (em anos)"
              type="number"
              v-model="form.tempoExperienciaGestao"
              min="0"
            />
          </div>
        </div>

        <!-- Seção 2: Documentos Obrigatórios -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">2. Documentos Comprobatórios (Upload Obrigatório)</h2>
          
          <div class="grid md:grid-cols-2 gap-6">
            <FileUpload
              id="rg"
              label="Documento de Identificação (RG)"
              accept=".pdf,.jpg,.jpeg,.png"
              accept-text="PDF, JPG ou PNG (máx. 5MB)"
              v-model="files.rg"
            />
            
            <FileUpload
              id="cpf"
              label="CPF"
              accept=".pdf,.jpg,.jpeg,.png"
              accept-text="PDF, JPG ou PNG (máx. 5MB)"
              v-model="files.cpf"
            />
            
            <FileUpload
              id="comprovante_residencia"
              label="Comprovante de Residência"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.comprovante_residencia"
            />
            
            <FileUpload
              id="foto_3x4"
              label="Foto 3x4"
              accept=".jpg,.jpeg,.png"
              accept-text="JPG ou PNG (máx. 5MB)"
              v-model="files.foto_3x4"
            />
            
            <FileUpload
              id="qualificacao_profissional"
              label="Comprovantes da Qualificação Profissional"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.qualificacao_profissional"
            />
            
            <FileUpload
              id="declaracao_experiencia"
              label="Declaração de Experiência Profissional"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.declaracao_experiencia"
            />
            
            <FileUpload
              id="titulo_eleitor"
              label="Título de Eleitor e Comprovante de Quitação Eleitoral"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.titulo_eleitor"
            />
            
            <FileUpload
              v-if="form.sexo === 'Masculino'"
              id="certificado_reservista"
              label="Certificado de Reservista"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.certificado_reservista"
            />
          </div>
        </div>

        <!-- Seção 3: Títulos e Experiência -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">3. Títulos e Experiência (Para Análise de Títulos)</h2>
          <p class="text-sm text-gray-600 mb-6">Esta seção é opcional, mas essencial para a pontuação do candidato.</p>
          
          <div class="grid md:grid-cols-2 gap-6">
            <FileUpload
              id="doutorado"
              label="ANEXO 2.1: Doutorado na Área da Educação"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.doutorado"
            />
            
            <FileUpload
              id="mestrado"
              label="ANEXO 2.2: Mestrado na Área da Educação"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.mestrado"
            />
            
            <FileUpload
              id="pos_graduacao"
              label="ANEXO 2.3: Pós-graduação lato sensu em Gestão Escolar"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.pos_graduacao"
            />
            
            <FormInput
              id="tempo_magisterio"
              label="ANEXO 3.1: Tempo de efetivo exercício no magistério da rede municipal (em anos)"
              type="number"
              v-model="form.tempo_magisterio"
              min="0"
              max="20"
              help="Máximo 20 anos (1 ponto por ano)"
            />
            
            <FileUpload
              id="experiencia_gestao"
              label="ANEXO 3.2: Comprovante de Experiência em função de gestão"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.experiencia_gestao"
            />
            
            <FileUpload
              id="cursos_formacao"
              label="ANEXO 3.3: Certificados de cursos de formação continuada"
              accept=".pdf"
              accept-text="PDF (máx. 5MB cada)"
              v-model="files.cursos_formacao"
            />
          </div>
        </div>

        <!-- Seção 4: Plano de Gestão -->
        <div class="card">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">4. Plano de Gestão Escolar</h2>
          
          <div v-if="!isManagementPlanPeriod" class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex">
              <svg class="h-5 w-5 text-yellow-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 class="text-sm font-medium text-yellow-800">Período não disponível</h3>
                <p class="text-sm text-yellow-700 mt-1">{{ managementPlanMessage }}</p>
              </div>
            </div>
          </div>
          
          <div v-else>
            <p class="text-sm text-gray-600 mb-4">
              O Plano de Gestão Escolar deve ser enviado no período de 15/12/2025 a 19/12/2025.
            </p>
            
            <FileUpload
              id="plano_gestao"
              label="Plano de Gestão Escolar"
              accept=".pdf"
              accept-text="PDF (máx. 5MB)"
              v-model="files.plano_gestao"
            />
          </div>
        </div>

        <!-- Botões de Ação -->
        <div class="flex justify-between items-center pt-6 border-t">
          <button
            type="button"
            class="btn-secondary"
            @click="goBack"
            :disabled="currentSection === 1"
          >
            ← Anterior
          </button>
          
          <div class="flex space-x-4">
            <button
              type="button"
              class="btn-secondary"
              @click="saveDraft"
              :disabled="isSubmitting"
            >
              Salvar Rascunho
            </button>
            
            <button
              type="submit"
              class="btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">Enviando...</span>
              <span v-else>Enviar Inscrição</span>
            </button>
          </div>
        </div>
      </form>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useDateRange } from '~/composables/useDateRange'

// Meta
definePageMeta({
  title: 'Formulário de Inscrição'
})

// Composables
const isSubmitting = ref(false)

const { isManagementPlanPeriod, managementPlanMessage } = useDateRange()

// Estado do formulário
const currentSection = ref(1)

const form = ref({
  nomeCompleto: '',
  cpf: '',
  email: '',
  telefone: '',
  unidadeEnsino: '',
  funcaoAtual: '',
  formacaoAcademica: '',
  sexo: '',
  tempoExperienciaGestao: 0,
  tempo_magisterio: 0
})

const files = ref<Record<string, File | null>>({
  rg: null,
  cpf: null,
  comprovante_residencia: null,
  foto_3x4: null,
  qualificacao_profissional: null,
  declaracao_experiencia: null,
  titulo_eleitor: null,
  certificado_reservista: null,
  doutorado: null,
  mestrado: null,
  pos_graduacao: null,
  experiencia_gestao: null,
  cursos_formacao: null,
  plano_gestao: null
})

// Opções dos selects
const formacaoOptions = [
  { value: 'Licenciatura', label: 'Licenciatura' },
  { value: 'Especialização', label: 'Especialização' },
  { value: 'Mestrado', label: 'Mestrado' },
  { value: 'Doutorado', label: 'Doutorado' }
]

const sexoOptions = [
  { value: 'Masculino', label: 'Masculino' },
  { value: 'Feminino', label: 'Feminino' }
]

// Formatação de campos
const formatCPF = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value.replace(/\D/g, '')
  value = value.replace(/(\d{3})(\d)/, '$1.$2')
  value = value.replace(/(\d{3})(\d)/, '$1.$2')
  value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  form.value.cpf = value
}

const formatPhone = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value.replace(/\D/g, '')
  value = value.replace(/(\d{2})(\d)/, '($1) $2')
  value = value.replace(/(\d{5})(\d)/, '$1-$2')
  form.value.telefone = value
}

// Sem validações: removidas obrigatoriedades e verificações de erro

// Navegação
const goBack = () => {
  if (currentSection.value > 1) {
    currentSection.value--
  }
}

// Ações do formulário
const saveDraft = () => {
  // Implementar salvamento de rascunho
  console.log('Salvando rascunho...')
}

const submitForm = async () => {
  // Sem validações: envio direto
  
  isSubmitting.value = true
  
  try {
    const formData = new FormData()
    
    // Adicionar dados do formulário
    Object.entries(form.value).forEach(([key, value]) => {
      formData.append(key, String(value))
    })
    
    // Adicionar arquivos
    Object.entries(files.value).forEach(([key, file]) => {
      if (file) {
        formData.append(key, file)
      }
    })
    
    const response = await $fetch('/api/inscricao', {
      method: 'POST',
      body: formData
    })
    
    if (response.success) {
      // Redirecionar para página de confirmação
      await navigateTo(`/inscricao/confirmacao?protocolo=${response.protocolo}`)
    }
    
  } catch (error: any) {
    console.error('Erro na inscrição:', error)
    // Mostrar erro para o usuário
  } finally {
    isSubmitting.value = false
  }
}
</script>
