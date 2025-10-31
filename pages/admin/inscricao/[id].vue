<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border-b border-blue-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Detalhes da Inscrição</h1>
            <div class="mt-2 flex items-center gap-3">
              <p class="text-sm text-gray-700">{{ candidato?.nomeCompleto || 'Carregando...' }}</p>
              <span v-if="candidato" class="text-sm font-mono font-semibold text-blue-600">
                • {{ getProtocolo(candidato.id) }}
              </span>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <NuxtLink
              to="/admin"
              class="btn-secondary"
            >
              ← Voltar
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-sm text-gray-500">Carregando...</p>
      </div>

      <div v-else-if="!candidato" class="text-center py-12">
        <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="mt-2 text-sm text-gray-500">Candidato não encontrado</p>
      </div>

      <div v-else class="space-y-8">
        <!-- Informações Pessoais -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Informações Pessoais e Profissionais</h2>
          
          <div class="grid md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-500">Nome Completo</label>
              <p class="mt-1 text-sm text-gray-900">{{ candidato.nomeCompleto }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">CPF</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatCPF(candidato.cpf) }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">E-mail</label>
              <p class="mt-1 text-sm text-gray-900">{{ candidato.email }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Telefone</label>
              <p class="mt-1 text-sm text-gray-900">{{ candidato.telefone }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Unidade de Ensino</label>
              <p class="mt-1 text-sm text-gray-900">{{ candidato.unidadeEnsino }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Função Atual</label>
              <p class="mt-1 text-sm text-gray-900">{{ candidato.funcaoAtual }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Formação Acadêmica</label>
              <p class="mt-1 text-sm text-gray-900">{{ candidato.formacaoAcademica }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Tempo de Experiência em Gestão</label>
              <p class="mt-1 text-sm text-gray-900">{{ candidato.tempoExperienciaGestao }} anos</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Sexo</label>
              <p class="mt-1 text-sm text-gray-900">{{ candidato.sexo || 'Não informado' }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500">Data da Inscrição</label>
              <p class="mt-1 text-sm text-gray-900">{{ formatDate(candidato.createdAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Pontuação de Títulos -->
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Pontuação de Títulos</h2>
            <button
              v-if="hasPendingTitles"
              @click="approveAllTitles"
              :disabled="approvingAll"
              class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2">
              <span v-if="approvingAll">Processando...</span>
              <span v-else>✓ Aprovar Todos os Títulos</span>
            </button>
          </div>
          
          <!-- Dashboard horizontal -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <!-- Card Formação Acadêmica -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-600 mb-2">Formação Acadêmica</div>
              <div class="text-2xl font-bold text-blue-600">{{ projectedScore.formacao }}</div>
              <div class="text-xs text-gray-500 mt-1">pontos</div>
              </div>
              
            <!-- Card Tempo no Magistério -->
            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-600 mb-2">Tempo no Magistério</div>
              <div class="text-2xl font-bold text-green-600">{{ projectedScore.tempoMagisterio }}</div>
              <div class="text-xs text-gray-500 mt-1">pontos</div>
              </div>
              
            <!-- Card Experiência em Gestão -->
            <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-600 mb-2">Experiência em Gestão</div>
              <div class="text-2xl font-bold text-purple-600">{{ projectedScore.experienciaGestao }}</div>
              <div class="text-xs text-gray-500 mt-1">pontos</div>
              </div>
              
            <!-- Card Cursos de Formação -->
            <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
              <div class="text-xs font-medium text-gray-600 mb-2">Cursos de Formação</div>
              <div class="text-2xl font-bold text-orange-600">{{ projectedScore.cursosFormacao }}</div>
              <div class="text-xs text-gray-500 mt-1">pontos</div>
            </div>
            
            <!-- Card Total (destaque) -->
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 border border-blue-700 shadow-lg hover:shadow-xl transition-shadow">
              <div class="text-xs font-medium text-blue-100 mb-2">Pontos Totais</div>
              <div class="text-3xl font-bold text-white">{{ projectedScore.total }}</div>
              <div class="text-xs text-blue-100 mt-1">pontos</div>
            </div>
          </div>
        </div>

        <!-- Documentos Obrigatórios -->
        <DocumentList
          :documents="candidato.documents.filter(d => ['rg', 'cpf', 'comprovante_residencia', 'foto_3x4', 'qualificacao_profissional', 'declaracao_experiencia', 'titulo_eleitor', 'certificado_reservista'].includes(d.type))"
          title="Documentos Obrigatórios"
          :show-preview="true"
        />

        <!-- ANEXO 2: Formação Acadêmica - Validação -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">ANEXO 2: Formação Acadêmica - Validação</h2>
          
          <!-- 2.1 - Doutorado -->
          <div v-for="title in candidato.titles.filter(t => t.type === 'doutorado')" 
               :key="title.id" 
               class="mb-6 p-4 border rounded-lg"
               :class="{
                 'border-yellow-300 bg-yellow-50': title.status === 'pending' || title.status === null || title.status === undefined,
                 'border-green-300 bg-green-50': title.status === 'approved',
                 'border-red-300 bg-red-50': title.status === 'rejected'
               }">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">2.1 - Doutorado na Área da Educação</h3>
              <p class="text-sm text-gray-600 mb-3">15 pontos</p>
              
              <div class="flex items-center gap-3 mb-3">
                <span class="px-2 py-1 text-xs font-medium rounded"
                      :class="{
                        'bg-yellow-200 text-yellow-800': title.status === 'pending' || title.status === null || title.status === undefined,
                        'bg-green-200 text-green-800': title.status === 'approved',
                        'bg-red-200 text-red-800': title.status === 'rejected'
                      }">
                  {{ (title.status === 'pending' || title.status === null || title.status === undefined) ? 'Pendente' : title.status === 'approved' ? 'Aprovado' : 'Rejeitado' }}
                </span>
              </div>
              
              <div v-if="title.filename" class="mb-3">
                <a :href="`/api/admin/document/${title.id}`" 
                   target="_blank"
                   class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ title.filename }}
                </a>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">
                <strong>Pontuação automática:</strong> 15 pontos
              </p>
              <p v-if="title.status === 'approved' && title.pontosAprovados !== null" class="text-sm text-gray-600 mb-3">
                <strong>Pontuação aprovada:</strong> {{ title.pontosAprovados }} pontos
              </p>
            </div>
            
            <div class="border-t pt-4 mt-4">
              <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Pontos aprovados <span class="text-gray-500 font-normal">(máximo 15 pontos)</span>
                  </label>
                  <input 
                    v-model.number="validationForms[title.id].pontosAprovados"
                    type="number" 
                    step="0.1"
                    min="0"
                    max="15"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sugestão: 15 pontos"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Observação (opcional)
                  </label>
                  <input 
                    v-model="validationForms[title.id].observacao"
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Documento válido"
                  />
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  @click="validateTitle(title.id, 'approved')"
                  :disabled="validating[title.id]"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[title.id]">Processando...</span>
                  <span v-else>✓ Aprovar</span>
                </button>
                <button
                  @click="validateTitle(title.id, 'rejected')"
                  :disabled="validating[title.id]"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[title.id]">Processando...</span>
                  <span v-else>✗ Rejeitar</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 2.2 - Mestrado -->
          <div v-for="title in candidato.titles.filter(t => t.type === 'mestrado')" 
               :key="title.id" 
               class="mb-6 p-4 border rounded-lg"
               :class="{
                 'border-yellow-300 bg-yellow-50': title.status === 'pending' || title.status === null || title.status === undefined,
                 'border-green-300 bg-green-50': title.status === 'approved',
                 'border-red-300 bg-red-50': title.status === 'rejected'
               }">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">2.2 - Mestrado na Área da Educação</h3>
              <p class="text-sm text-gray-600 mb-3">10 pontos</p>
              
              <div class="flex items-center gap-3 mb-3">
                <span class="px-2 py-1 text-xs font-medium rounded"
                      :class="{
                        'bg-yellow-200 text-yellow-800': title.status === 'pending' || title.status === null || title.status === undefined,
                        'bg-green-200 text-green-800': title.status === 'approved',
                        'bg-red-200 text-red-800': title.status === 'rejected'
                      }">
                  {{ (title.status === 'pending' || title.status === null || title.status === undefined) ? 'Pendente' : title.status === 'approved' ? 'Aprovado' : 'Rejeitado' }}
                </span>
              </div>
              
              <div v-if="title.filename" class="mb-3">
                <a :href="`/api/admin/document/${title.id}`" 
                   target="_blank"
                   class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ title.filename }}
                </a>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">
                <strong>Pontuação automática:</strong> 10 pontos
              </p>
              <p v-if="title.status === 'approved' && title.pontosAprovados !== null" class="text-sm text-gray-600 mb-3">
                <strong>Pontuação aprovada:</strong> {{ title.pontosAprovados }} pontos
              </p>
            </div>
            
            <div class="border-t pt-4 mt-4">
              <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Pontos aprovados <span class="text-gray-500 font-normal">(máximo 10 pontos)</span>
                  </label>
                  <input 
                    v-model.number="validationForms[title.id].pontosAprovados"
                    type="number" 
                    step="0.1"
                    min="0"
                    max="10"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sugestão: 10 pontos"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Observação (opcional)
                  </label>
                  <input 
                    v-model="validationForms[title.id].observacao"
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Documento válido"
                  />
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  @click="validateTitle(title.id, 'approved')"
                  :disabled="validating[title.id]"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[title.id]">Processando...</span>
                  <span v-else>✓ Aprovar</span>
                </button>
                <button
                  @click="validateTitle(title.id, 'rejected')"
                  :disabled="validating[title.id]"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[title.id]">Processando...</span>
                  <span v-else>✗ Rejeitar</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 2.3 - Pós-graduação -->
          <div v-for="title in candidato.titles.filter(t => t.type === 'pos_graduacao')" 
               :key="title.id" 
               class="mb-6 p-4 border rounded-lg"
               :class="{
                 'border-yellow-300 bg-yellow-50': title.status === 'pending' || title.status === null || title.status === undefined,
                 'border-green-300 bg-green-50': title.status === 'approved',
                 'border-red-300 bg-red-50': title.status === 'rejected'
               }">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">2.3 - Pós-graduação lato sensu (especialização) em Gestão Escolar ou áreas correlatas</h3>
              <p class="text-sm text-gray-600 mb-3">5 pontos</p>
              
              <div class="flex items-center gap-3 mb-3">
                <span class="px-2 py-1 text-xs font-medium rounded"
                      :class="{
                        'bg-yellow-200 text-yellow-800': title.status === 'pending' || title.status === null || title.status === undefined,
                        'bg-green-200 text-green-800': title.status === 'approved',
                        'bg-red-200 text-red-800': title.status === 'rejected'
                      }">
                  {{ (title.status === 'pending' || title.status === null || title.status === undefined) ? 'Pendente' : title.status === 'approved' ? 'Aprovado' : 'Rejeitado' }}
                </span>
              </div>
              
              <div v-if="title.filename" class="mb-3">
                <a :href="`/api/admin/document/${title.id}`" 
                   target="_blank"
                   class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ title.filename }}
                </a>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">
                <strong>Pontuação automática:</strong> 5 pontos
              </p>
              <p v-if="title.status === 'approved' && title.pontosAprovados !== null" class="text-sm text-gray-600 mb-3">
                <strong>Pontuação aprovada:</strong> {{ title.pontosAprovados }} pontos
              </p>
            </div>
            
            <div class="border-t pt-4 mt-4">
              <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Pontos aprovados <span class="text-gray-500 font-normal">(máximo 5 pontos)</span>
                  </label>
                  <input 
                    v-model.number="validationForms[title.id].pontosAprovados"
                    type="number" 
                    step="0.1"
                    min="0"
                    max="5"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sugestão: 5 pontos"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Observação (opcional)
                  </label>
                  <input 
                    v-model="validationForms[title.id].observacao"
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Documento válido"
                  />
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  @click="validateTitle(title.id, 'approved')"
                  :disabled="validating[title.id]"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[title.id]">Processando...</span>
                  <span v-else>✓ Aprovar</span>
                </button>
                <button
                  @click="validateTitle(title.id, 'rejected')"
                  :disabled="validating[title.id]"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[title.id]">Processando...</span>
                  <span v-else>✗ Rejeitar</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ANEXO 3: Experiência Profissional - Validação -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">ANEXO 3: Experiência Profissional - Validação</h2>
          
          <!-- 3.1 - Tempo de Magistério -->
          <div v-for="title in candidato.titles.filter(t => t.type === 'tempo_magisterio')" 
               :key="title.id" 
               class="mb-6 p-4 border rounded-lg"
               :class="{
                 'border-yellow-300 bg-yellow-50': title.status === 'pending' || title.status === null || title.status === undefined,
                 'border-green-300 bg-green-50': title.status === 'approved',
                 'border-red-300 bg-red-50': title.status === 'rejected'
               }">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">3.1 - Tempo de efetivo exercício no magistério da rede municipal</h3>
              <p class="text-sm text-gray-600 mb-3">1 ponto por ano, até o limite de 20 anos.</p>
              
              <div class="flex items-center gap-3 mb-3">
                <span class="text-sm font-medium text-gray-700">
                  Valor informado: <span class="text-lg font-bold text-blue-600">{{ title.value || 0 }} {{ (title.value || 0) === 1 ? 'ano' : 'anos' }}</span>
                </span>
                <span class="px-2 py-1 text-xs font-medium rounded"
                      :class="{
                        'bg-yellow-200 text-yellow-800': title.status === 'pending' || title.status === null || title.status === undefined,
                        'bg-green-200 text-green-800': title.status === 'approved',
                        'bg-red-200 text-red-800': title.status === 'rejected'
                      }">
                  {{ (title.status === 'pending' || title.status === null || title.status === undefined) ? 'Pendente' : title.status === 'approved' ? 'Aprovado' : 'Rejeitado' }}
                </span>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">
                <strong>Pontuação automática calculada:</strong> {{ Math.min(title.value || 0, 20) }} pontos
              </p>
              <p v-if="title.status === 'approved' && title.pontosAprovados !== null" class="text-sm text-gray-600 mb-3">
                <strong>Pontuação aprovada:</strong> {{ title.pontosAprovados }} pontos
              </p>
            </div>
            
            <div class="border-t pt-4 mt-4">
              <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Pontos aprovados <span class="text-gray-500 font-normal">(máximo 20 pontos)</span>
                  </label>
                  <input 
                    v-model.number="validationForms[title.id].pontosAprovados"
                    type="number" 
                    step="0.1"
                    min="0"
                    max="20"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :placeholder="`Sugestão: ${Math.min(title.value || 0, 20)} pontos`"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Observação (opcional)
                  </label>
                  <input 
                    v-model="validationForms[title.id].observacao"
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Documento válido"
                  />
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  @click="validateTitle(title.id, 'approved')"
                  :disabled="validating[title.id]"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[title.id]">Processando...</span>
                  <span v-else>✓ Aprovar</span>
                </button>
                <button
                  @click="validateTitle(title.id, 'rejected')"
                  :disabled="validating[title.id]"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[title.id]">Processando...</span>
                  <span v-else>✗ Rejeitar</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 3.2 - Experiência em Gestão -->
          <div v-if="experienciaGestaoTitle"
               :key="experienciaGestaoTitle.id" 
               class="mb-6 p-4 border rounded-lg"
               :class="{
                 'border-yellow-300 bg-yellow-50': experienciaGestaoTitle.status === 'pending' || experienciaGestaoTitle.status === null || experienciaGestaoTitle.status === undefined,
                 'border-green-300 bg-green-50': experienciaGestaoTitle.status === 'approved',
                 'border-red-300 bg-red-50': experienciaGestaoTitle.status === 'rejected'
               }">
            <div class="mb-4">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">3.2 - Experiência comprovada em função de gestão escolar</h3>
              <p class="text-sm text-gray-600 mb-3">3 pontos por ano, até o limite de 10 anos.</p>
              
              <div class="flex items-center gap-3 mb-3">
                <span class="text-sm font-medium text-gray-700">
                  Valor informado: <span class="text-lg font-bold text-blue-600">{{ experienciaGestaoTitle.value || candidato.tempoExperienciaGestao || 0 }} {{ (experienciaGestaoTitle.value || candidato.tempoExperienciaGestao || 0) === 1 ? 'ano' : 'anos' }}</span>
                </span>
                <span class="px-2 py-1 text-xs font-medium rounded"
                      :class="{
                        'bg-yellow-200 text-yellow-800': experienciaGestaoTitle.status === 'pending' || experienciaGestaoTitle.status === null || experienciaGestaoTitle.status === undefined,
                        'bg-green-200 text-green-800': experienciaGestaoTitle.status === 'approved',
                        'bg-red-200 text-red-800': experienciaGestaoTitle.status === 'rejected'
                      }">
                  {{ (experienciaGestaoTitle.status === 'pending' || experienciaGestaoTitle.status === null || experienciaGestaoTitle.status === undefined) ? 'Pendente' : experienciaGestaoTitle.status === 'approved' ? 'Aprovado' : 'Rejeitado' }}
                </span>
              </div>
              
              <div v-if="experienciaGestaoTitle.filename" class="mb-3">
                <a :href="`/api/admin/document/${experienciaGestaoTitle.id}`" 
                   target="_blank"
                   class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ experienciaGestaoTitle.filename }}
                </a>
              </div>
              
              <p class="text-sm text-gray-600 mb-3">
                <strong>Pontuação automática calculada:</strong> {{ Math.min((experienciaGestaoTitle.value || candidato.tempoExperienciaGestao || 0) * 3, 30) }} pontos
              </p>
              <p v-if="experienciaGestaoTitle.status === 'approved' && experienciaGestaoTitle.pontosAprovados !== null" class="text-sm text-gray-600 mb-3">
                <strong>Pontuação aprovada:</strong> {{ experienciaGestaoTitle.pontosAprovados }} pontos
              </p>
            </div>
            
            <div class="border-t pt-4 mt-4">
              <div class="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Pontos aprovados <span class="text-gray-500 font-normal">(máximo 30 pontos)</span>
                  </label>
                  <input 
                    v-model.number="validationForms[experienciaGestaoTitle.id].pontosAprovados"
                    type="number" 
                    step="0.1"
                    min="0"
                    max="30"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    :placeholder="`Sugestão: ${Math.min((experienciaGestaoTitle.value || candidato.tempoExperienciaGestao || 0) * 3, 30)} pontos`"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Observação (opcional)
                  </label>
                  <input 
                    v-model="validationForms[experienciaGestaoTitle.id].observacao"
                    type="text" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Documento válido"
                  />
                </div>
              </div>
              
              <div class="flex gap-2">
                <button
                  @click="validateTitle(experienciaGestaoTitle.id, 'approved')"
                  :disabled="validating[experienciaGestaoTitle.id]"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[experienciaGestaoTitle.id]">Processando...</span>
                  <span v-else>✓ Aprovar</span>
                </button>
                <button
                  @click="validateTitle(experienciaGestaoTitle.id, 'rejected')"
                  :disabled="validating[experienciaGestaoTitle.id]"
                  class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                  <span v-if="validating[experienciaGestaoTitle.id]">Processando...</span>
                  <span v-else>✗ Rejeitar</span>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 3.3 - Cursos de Formação -->
          <div v-if="candidato.titles.filter(t => t.type === 'cursos_formacao').length > 0" class="mb-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">3.3 - Cursos de formação continuada em Gestão Escolar, Gestão Pública, PPP ou afins</h3>
            <p class="text-sm text-gray-600 mb-4">1 ponto por curso de no mínimo 40 horas, até o limite de 20 pontos.</p>
            
            <div v-for="title in candidato.titles.filter(t => t.type === 'cursos_formacao')" 
                 :key="title.id" 
                 class="mb-4 p-4 border rounded-lg"
                 :class="{
                   'border-yellow-300 bg-yellow-50': title.status === 'pending',
                   'border-green-300 bg-green-50': title.status === 'approved',
                   'border-red-300 bg-red-50': title.status === 'rejected'
                 }">
              <div class="mb-3">
                <div class="flex items-center gap-3 mb-2">
                  <span class="font-medium text-gray-900">Curso {{ candidato.titles.filter(t => t.type === 'cursos_formacao').indexOf(title) + 1 }}</span>
                  <span class="px-2 py-1 text-xs font-medium rounded"
                        :class="{
                          'bg-yellow-200 text-yellow-800': title.status === 'pending',
                          'bg-green-200 text-green-800': title.status === 'approved',
                          'bg-red-200 text-red-800': title.status === 'rejected'
                        }">
                    {{ title.status === 'pending' ? 'Pendente' : title.status === 'approved' ? 'Aprovado' : 'Rejeitado' }}
                  </span>
                </div>
                
                <div v-if="title.filename" class="mb-2">
                  <a :href="`/api/admin/document/${title.id}`" 
                     target="_blank"
                     class="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {{ title.filename }}
                  </a>
                </div>
                
                <p class="text-sm text-gray-600 mb-2">
                  <strong>Pontuação automática:</strong> 1 ponto por curso
                </p>
                <p v-if="title.status === 'approved' && title.pontosAprovados !== null" class="text-sm text-gray-600 mb-2">
                  <strong>Pontuação aprovada:</strong> {{ title.pontosAprovados }} pontos
                </p>
              </div>
              
              <div class="border-t pt-3 mt-3">
                <div class="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Pontos aprovados <span class="text-gray-500 font-normal">(máximo 1 ponto por curso, total máximo 20)</span>
                    </label>
                    <input 
                      v-model.number="validationForms[title.id].pontosAprovados"
                      type="number" 
                      step="0.1"
                      min="0"
                      max="1"
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Sugestão: 1 ponto"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Observação (opcional)
                    </label>
                    <input 
                      v-model="validationForms[title.id].observacao"
                      type="text" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Curso válido de 40 horas"
                    />
                  </div>
                </div>
                
                <div class="flex gap-2">
                  <button
                    @click="validateTitle(title.id, 'approved')"
                    :disabled="validating[title.id]"
                    class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                    <span v-if="validating[title.id]">Processando...</span>
                    <span v-else>✓ Aprovar</span>
                  </button>
                  <button
                    @click="validateTitle(title.id, 'rejected')"
                    :disabled="validating[title.id]"
                    class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">
                    <span v-if="validating[title.id]">Processando...</span>
                    <span v-else>✗ Rejeitar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        

        <!-- Plano de Gestão -->
        <div v-if="candidato.managementPlan" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Plano de Gestão Escolar</h2>
          
          <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <svg class="h-8 w-8 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p class="text-sm font-medium text-green-800">Plano de Gestão Enviado</p>
                <p class="text-xs text-green-600">{{ candidato.managementPlan.filename }}</p>
                <p class="text-xs text-green-600">Enviado em {{ formatDate(candidato.managementPlan.uploadedAt) }}</p>
              </div>
            </div>
            
            <button
              @click="downloadDocument(candidato.managementPlan.id)"
              class="btn-primary"
            >
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Baixar
            </button>
          </div>
        </div>

        <!-- Recursos (se houver) -->
        <div v-if="candidato.resources && candidato.resources.length > 0" class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-6">Recursos</h2>
          
          <div class="space-y-4">
            <div
              v-for="recurso in candidato.resources"
              :key="recurso.id"
              class="p-4 border border-gray-200 rounded-lg"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-sm font-medium text-gray-900">{{ getResourceTypeLabel(recurso.type) }}</h3>
                  <p class="text-xs text-gray-500 mt-1">Enviado em {{ formatDate(recurso.submittedAt) }}</p>
                  <p v-if="recurso.description" class="text-sm text-gray-700 mt-2">{{ recurso.description }}</p>
                </div>
                
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
                      :class="getResourceStatusClass(recurso.status)">
                  {{ getResourceStatusLabel(recurso.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
// Meta
definePageMeta({
  title: 'Detalhes da Inscrição'
  // middleware: 'admin-auth' // Removido - acesso direto
})

// Estado
const loading = ref(true)
const candidato = ref(null)
const validating = ref<Record<string, boolean>>({})
const validationForms = ref<Record<string, { pontosAprovados: number | null, observacao: string }>>({})
const approvingAll = ref(false)

// Obter ID da rota
const route = useRoute()
const candidatoId = route.params.id as string

// Calcular pontuação automática sugerida para um título
const getSuggestedPoints = (title: any) => {
  if (!title) return 0
  
  // Se já foi aprovado com pontos customizados, manter esse valor
  if (title.status === 'approved' && title.pontosAprovados !== null && title.pontosAprovados !== undefined) {
    return title.pontosAprovados
  }
  
  // Calcular pontuação automática baseada no tipo
  switch (title.type) {
    case 'doutorado':
      return 15
    case 'mestrado':
      return 10
    case 'pos_graduacao':
      return 5
    case 'experiencia_gestao':
      // 3 pontos por ano, máximo 30 pontos (10 anos)
      const anosGestao = title.value || (candidato.value?.tempoExperienciaGestao ?? 0)
      return Math.min(anosGestao * 3, 30)
    case 'tempo_magisterio':
      // 1 ponto por ano, máximo 20 pontos
      return Math.min(title.value || 0, 20)
    case 'cursos_formacao':
      // 1 ponto por curso
      return 1
    default:
      return 0
  }
}

// Carregar dados do candidato
const loadCandidato = async () => {
  loading.value = true
  
  try {
    const response = await $fetch(`/api/admin/inscricao/${candidatoId}`)
    
    if (response.success) {
      candidato.value = response.data
      
      // Inicializar formulários de validação para cada título
      if (candidato.value.titles) {
        candidato.value.titles.forEach((title: any) => {
          // Se já foi aprovado com pontos customizados, usar esse valor
          // Caso contrário, pré-preencher com a pontuação automática sugerida
          const suggestedPoints = title.pontosAprovados !== null && title.status === 'approved' 
            ? title.pontosAprovados 
            : getSuggestedPoints(title)
          
          validationForms.value[title.id] = {
            pontosAprovados: suggestedPoints,
            observacao: title.observacao || ''
          }
        })
      }
    }
    
  } catch (error) {
    console.error('Erro ao carregar candidato:', error)
  } finally {
    loading.value = false
  }
}

// Formatação
const formatCPF = (cpf: string) => {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getProtocolo = (candidateId: string) => {
  return `SEG-${candidateId.slice(-8).toUpperCase()}`
}

// Download de documento
const downloadDocument = (documentId: string) => {
  window.open(`/api/admin/document/${documentId}`, '_blank')
}

// Função para mapear títulos para o formato esperado pelo DocumentList
const mapTitleToDocument = (title: any) => {
  if (!title.filename) return null
  return {
    id: title.id,
    type: title.type,
    filename: title.filename,
    size: title.size || 0,
    uploadedAt: title.uploadedAt,
    mimeType: title.mimeType || 'application/pdf'
  }
}

// Labels para recursos
const getResourceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    homologacao: 'Recurso contra Homologação',
    gabarito: 'Recurso contra Gabarito',
    resultado: 'Recurso contra Resultado Preliminar'
  }
  return labels[type] || type
}

const getResourceStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado'
  }
  return labels[status] || status
}

const getResourceStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

// Labels e funções para validação de títulos
const getTitleLabel = (type: string) => {
  const labels: Record<string, string> = {
    doutorado: 'Doutorado',
    mestrado: 'Mestrado',
    pos_graduacao: 'Pós-graduação / Especialização',
    experiencia_gestao: 'Experiência em Gestão Escolar',
    cursos_formacao: 'Cursos de Formação',
    tempo_magisterio: 'Tempo no Magistério'
  }
  return labels[type] || type
}

const getMaxPoints = (type: string) => {
  const maxPoints: Record<string, number> = {
    doutorado: 15,
    mestrado: 10,
    pos_graduacao: 5,
    experiencia_gestao: 30,
    cursos_formacao: 20,
    tempo_magisterio: 20
  }
  return maxPoints[type] || 100
}

// Validar título
const validateTitle = async (titleId: string, status: 'approved' | 'rejected' | 'pending') => {
  validating.value[titleId] = true
  
  try {
    const formData = validationForms.value[titleId]
    
    // Se rejeitando, limpar os pontos (títulos rejeitados não pontuam)
    // Se aprovando, enviar o valor do campo (que já vem pré-preenchido com a sugestão)
    // Se o campo estiver vazio ao aprovar, usar null para cálculo automático (fallback)
    let pontosParaEnviar = null
    if (status === 'approved') {
      // Se tem valor no campo (sugestão pré-preenchida ou customizado pelo admin), enviar
      if (formData.pontosAprovados !== null && formData.pontosAprovados !== undefined) {
        pontosParaEnviar = formData.pontosAprovados
      }
      // Se estiver vazio, deixar null para usar cálculo automático no backend
    } else if (status === 'rejected') {
      pontosParaEnviar = null
      // Limpar o campo visualmente também após rejeitar
      formData.pontosAprovados = null
    } else if (status === 'pending') {
      pontosParaEnviar = null
    }
    
    const response = await $fetch(`/api/admin/title/${titleId}/validate`, {
      method: 'POST',
      credentials: 'include',
      body: {
        status,
        pontosAprovados: pontosParaEnviar,
        observacao: formData.observacao || null
      }
    })
    
    if (response.success) {
      // Recarregar dados do candidato para atualizar a interface
      await loadCandidato()
      
      // Mostrar mensagem de sucesso
      alert(`Título ${status === 'approved' ? 'aprovado' : status === 'rejected' ? 'rejeitado' : 'marcado como pendente'} com sucesso!`)
    }
  } catch (error: any) {
    console.error('Erro ao validar título:', error)
    alert(error.data?.message || 'Erro ao validar título. Tente novamente.')
  } finally {
    validating.value[titleId] = false
  }
}

// Calcular pontuação projetada (considerando valores sugeridos dos títulos pendentes)
const projectedScore = computed(() => {
  if (!candidato.value || !candidato.value.titles) {
    return {
      formacao: 0,
      tempoMagisterio: 0,
      experienciaGestao: 0,
      cursosFormacao: 0,
      total: 0
    }
  }
  
  const titles = candidato.value.titles
  let formacao = 0
  let tempoMagisterio = 0
  let experienciaGestao = 0
  let cursosFormacao = 0
  
  // Formação Acadêmica
  // IMPORTANTE: SOMAR todos os títulos de formação acadêmica (doutorado + mestrado + pós-graduação)
  // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
  const titulosFormacao = titles.filter(t => 
    ['doutorado', 'mestrado', 'pos_graduacao'].includes(t.type) && 
    (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
  )
  
  // Somar pontos de todos os títulos de formação acadêmica
  formacao = titulosFormacao.reduce((sum, title) => {
    let pontos = 0
    
    // Se aprovado com pontos customizados, usar esse valor
    if (title.status === 'approved' && title.pontosAprovados !== null) {
      pontos = title.pontosAprovados || 0
    } 
    // Se pendente ou NULL (registros antigos), usar valor do formulário ou sugerido
    else if (title.status === 'pending' || title.status === null || title.status === undefined) {
      pontos = validationForms.value[title.id]?.pontosAprovados || getSuggestedPoints(title)
    }
    // Se aprovado sem pontos customizados, usar cálculo automático
    else if (title.status === 'approved') {
      pontos = getSuggestedPoints(title)
    }
    
    return sum + pontos
  }, 0)
  
  // Fallback: se não houver títulos de formação mas não forem rejeitados, usar campo formacaoAcademica
  // IMPORTANTE: Para inscrições antigas que não têm títulos, usar o campo direto do candidato
  if (formacao === 0) {
    const todosTitulosFormacao = titles.filter(t => 
      ['doutorado', 'mestrado', 'pos_graduacao'].includes(t.type)
    )
    // Se não há títulos OU se há títulos mas nenhum foi rejeitado, usar fallback
    const algumRejeitado = todosTitulosFormacao.some(t => t.status === 'rejected')
    if (todosTitulosFormacao.length === 0 || !algumRejeitado) {
      if (candidato.value.formacaoAcademica === 'Doutorado') formacao = 15
      else if (candidato.value.formacaoAcademica === 'Mestrado') formacao = 10
      else if (candidato.value.formacaoAcademica === 'Especialização') formacao = 5
    }
  }
  
  // Tempo de Magistério
  // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
  const tempoMagisterioTitle = titles.find(t => 
    t.type === 'tempo_magisterio' && 
    (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
  )
  if (tempoMagisterioTitle) {
    if (tempoMagisterioTitle.status === 'approved' && tempoMagisterioTitle.pontosAprovados !== null) {
      tempoMagisterio = tempoMagisterioTitle.pontosAprovados || 0
    } else {
      tempoMagisterio = validationForms.value[tempoMagisterioTitle.id]?.pontosAprovados || getSuggestedPoints(tempoMagisterioTitle)
    }
  }
  
  // Experiência em Gestão
  // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
  const experienciaGestaoTitle = titles.find(t => 
    t.type === 'experiencia_gestao' && 
    (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
  )
  if (experienciaGestaoTitle) {
    if (experienciaGestaoTitle.status === 'approved' && experienciaGestaoTitle.pontosAprovados !== null) {
      experienciaGestao = experienciaGestaoTitle.pontosAprovados || 0
    } else {
      experienciaGestao = validationForms.value[experienciaGestaoTitle.id]?.pontosAprovados || getSuggestedPoints(experienciaGestaoTitle)
    }
  } else {
    // FALLBACK: Se não há título mas o candidato tem tempoExperienciaGestao (inscrições antigas)
    if (candidato.value?.tempoExperienciaGestao > 0) {
      experienciaGestao = Math.min(candidato.value.tempoExperienciaGestao * 3, 30)
    }
  }
  
  // Cursos de Formação
  // IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
  const cursosFormacaoTitles = titles.filter(t => 
    t.type === 'cursos_formacao' && 
    (t.status === 'approved' || t.status === 'pending' || t.status === null || t.status === undefined)
  )
  cursosFormacao = cursosFormacaoTitles.reduce((sum, t) => {
    if (t.status === 'approved' && t.pontosAprovados !== null) {
      return sum + (t.pontosAprovados || 0)
    } else {
      return sum + (validationForms.value[t.id]?.pontosAprovados || getSuggestedPoints(t))
    }
  }, 0)
  cursosFormacao = Math.min(cursosFormacao, 20)
  
  return {
    formacao,
    tempoMagisterio,
    experienciaGestao,
    cursosFormacao,
    total: formacao + tempoMagisterio + experienciaGestao + cursosFormacao
  }
})

// Verificar se há títulos pendentes
// IMPORTANTE: Tratar NULL como 'pending' (para registros antigos antes da migração)
const hasPendingTitles = computed(() => {
  if (!candidato.value?.titles) return false
  return candidato.value.titles.some(t => t.status === 'pending' || t.status === null || t.status === undefined)
})

// Garantir que experiencia_gestao apareça apenas uma vez
// Prioriza o que tem arquivo, senão o que tem value, senão o mais recente
const experienciaGestaoTitle = computed(() => {
  if (!candidato.value?.titles) return null
  
  const gestaoTitles = candidato.value.titles.filter(t => t.type === 'experiencia_gestao')
  if (gestaoTitles.length === 0) return null
  
  // Priorizar: título com arquivo > título com value > mais recente
  const withFile = gestaoTitles.find(t => t.filename)
  if (withFile) return withFile
  
  const withValue = gestaoTitles.find(t => t.value)
  if (withValue) return withValue
  
  // Senão, retornar o mais recente
  return gestaoTitles.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0]
})

// Aprovar todos os títulos pendentes
const approveAllTitles = async () => {
  if (!candidato.value?.titles) return
  
  const pendingTitles = candidato.value.titles.filter(t => t.status === 'pending')
  if (pendingTitles.length === 0) return
  
  approvingAll.value = true
  
  try {
    // Aprovar todos os títulos pendentes em paralelo
    const promises = pendingTitles.map(title => {
      const formData = validationForms.value[title.id]
      return $fetch(`/api/admin/title/${title.id}/validate`, {
        method: 'POST',
        credentials: 'include',
        body: {
          status: 'approved',
          pontosAprovados: formData?.pontosAprovados || null,
          observacao: formData?.observacao || null
        }
      })
    })
    
    await Promise.all(promises)
    
    // Recarregar dados
    await loadCandidato()
    
    alert(`${pendingTitles.length} título(s) aprovado(s) com sucesso!`)
  } catch (error: any) {
    console.error('Erro ao aprovar todos os títulos:', error)
    alert(error.data?.message || 'Erro ao aprovar títulos. Tente novamente.')
  } finally {
    approvingAll.value = false
  }
}

// Carregar dados iniciais
onMounted(() => {
  loadCandidato()
})
</script>
