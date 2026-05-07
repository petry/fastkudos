# Especificação Técnica: FastKudos

## 1. Visão Geral
O **FastKudos** é uma aplicação web (PWA) de baixa fricção projetada para eventos de integração de equipas. O sistema permite que participantes se cadastrem instantaneamente apenas com o nome e troquem feedbacks positivos (kudos) em tempo real, promovendo o reconhecimento e a cultura de feedback.

## 2. Pilha Tecnológica (Tech Stack)
* **Frontend:** React (Vite) + Tailwind CSS.
* **Backend as a Service (BaaS):** Supabase.
    * **Autenticação:** Anonymous Auth (Participantes) e Email/Password (Admin).
    * **Base de Dados:** PostgreSQL.
    * **Realtime:** Supabase Realtime para atualização do mural.
* **Hospedagem:** Cloudflare Pages.

---

## 3. Arquitetura de Dados (Supabase)

### Tabela: `events`
Armazena as informações dos eventos criados pelos administradores.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Identificador único do evento. |
| `created_at` | timestamp | Data de criação. |
| `name` | text | Nome do evento (ex: "Integração Time Streaming 2026"). |
| `slug` | text (Unique) | Identificador na URL (ex: `offsite-tech`). |
| `owner_id` | uuid (FK) | Referência ao `auth.users` do administrador. |

### Tabela: `profiles`
Estende os dados de autenticação para participantes e administradores.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Referência ao `auth.uid()`. |
| `display_name`| text | Nome exibido no mural e nas caixas de recados. |
| `event_id` | uuid (FK) | Vínculo obrigatório com um evento. |
| `is_admin` | boolean | Define se o usuário tem permissões de moderação. |

### Tabela: `feedbacks`
Armazena as mensagens de kudos trocadas.
| Campo | Tipo | Descrição |
| :--- | :--- | :--- |
| `id` | uuid (PK) | Identificador da mensagem. |
| `created_at` | timestamp | Data/hora do envio. |
| `sender_id` | uuid (FK) | Referência ao `profiles.id` do remetente. |
| `receiver_id`| uuid (FK) | Referência ao `profiles.id` do destinatário. |
| `event_id` | uuid (FK) | Filtro para garantir isolamento entre eventos. |
| `content` | text | O conteúdo do feedback positivo. |

---

## 4. Requisitos Funcionais

### 4.1. Fluxo do Participante (Fricção Zero)
1.  **Acesso:** O usuário acede via link único: `fastkudos.app/e/[slug]`.
2.  **Onboarding:** Se não houver sessão ativa, o sistema solicita apenas o **Nome**.
    * O sistema executa `signInAnonymously()` no Supabase.
    * Cria um registo em `profiles` vinculado ao `event_id`.
3.  **Persistência:** A sessão anónima é mantida no `localStorage` pelo SDK do Supabase. Se o usuário fechar o browser e voltar, ele mantém a sua identidade e a sua "caixa de recados".
4.  **Interação:**
    * Visualizar lista de participantes do evento.
    * Enviar feedback para qualquer participante.
    * Ver a sua própria "Caixa de Recados" com mensagens recebidas.
    * Ver um feed global (Mural) em tempo real com todas as mensagens públicas do evento.

### 4.2. Fluxo do Administrador
1.  **Login:** Autenticação tradicional (Email/Senha).
2.  **Criação:** Criar novos eventos e gerar slugs únicos.
3.  **Moderação:** * Capacidade de apagar mensagens (feedbacks) inadequadas.
    * Capacidade de remover perfis (profiles) do evento.

### 4.3. Regras de Segurança (RLS)
* **Profiles:** Usuários anónimos podem ler perfis do mesmo `event_id`. Podem apenas editar o seu próprio `display_name`.
* **Feedbacks:** Usuários anónimos podem criar mensagens e ler mensagens onde o `event_id` corresponda ao seu.
* **Admin:** O `owner_id` do evento tem permissão total de `DELETE` em `feedbacks` e `profiles` vinculados ao seu evento.

---

## 5. Interface e Experiência (UX)
* **Design:** Minimalista, estilo "Flat Design", otimizado para dispositivos móveis (Mobile-first).
* **Feedback Visual:** Notificações instantâneas (Toasts) ao receber um novo kudo.
* **Busca:** Filtro rápido na lista de participantes para encontrar colegas facilmente.


## 6. Próximos Passos (Roadmap de Evolução)
•	Moderação: Painel administrativo para deletar mensagens ofensivas (se necessário).
•	Gamificação: Ranking de quem mais enviou feedbacks positivos para estimular a participação.
•	Exportação: Gerar um PDF ou imagem bonita para o usuário guardar os elogios que recebeu.