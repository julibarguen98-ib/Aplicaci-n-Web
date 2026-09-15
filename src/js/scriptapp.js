const API_URL = 'http://localhost:3000/task';

// Estado global de la aplicación
let tasks = [];
let activeFilter = 'ALL';

// Elementos del DOM
const DOM = {
  pingLabel: document.getElementById('ping-label'),
  columns: {
    do: document.querySelector('#col-todo .cards-container'),
    doing: document.querySelector('#col-doing .cards-container'),
    done: document.querySelector('#col-done .cards-container')
  },
  // Filtros y Búsqueda
  searchInput: document.getElementById('task-search-input'),
  priorityFilter: document.getElementById('task-priority-filter'),
  btnFilterAll: document.getElementById('filter-all'),
  btnFilterAssigned: document.getElementById('filter-asigned'),
  btnFilterPriority: document.getElementById('filter-priority'),
  // Modal Crear Tarea
  modalCreate: document.getElementById('modal-create-task'),
  formCreate: document.getElementById('form-create-task'),
  btnNewTask: document.getElementById('btn-new-task'),
  btnCloseCreate: document.querySelector('#modal-create-task .btn-close-modal'),
  // Modal Detalle / Edición de Tarea (Ventana Flotante)
  modalDetail: document.getElementById('task-detail'),
  formEdit: document.getElementById('form-edit-task'),
  btnCloseDetail: document.querySelector('.btn-close-detail'),
  btnDeleteTask: document.getElementById('btn-delete-task'),
  detailCardId: document.getElementById('detail-card-id'),
  detailTaskId: document.getElementById('detail-task-id'),
  detailTitle: document.getElementById('detail-title'),
  detailStatus: document.getElementById('detail-status-select'),
  detailPriority: document.getElementById('detail-priority'),
  detailDate: document.getElementById('detail-date'),
  detailDescription: document.getElementById('detail-description'),
  // Comentarios
  commentsList: document.getElementById('detail-comments-list'),
  formComment: document.getElementById('form-add-comment'),
  inputComment: document.getElementById('new-comment-tex')
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', () => {
  initSortable();
  setupEventListeners();
  fetchTasks();
  initColumnsToggle();
  initTaskFilter();
});

// Visibilidad del menú desplegable de columnas
function toggleColumnsMenu(menuElement) {
  if (!menuElement) return;
  const isVisible = menuElement.style.display === 'flex';
  menuElement.style.display = isVisible ? 'none' : 'flex';
}

//Reajuste el CSS Grid del tablero según las columnas visibles
function updateBoardGrid(boardElement, visibleCount) {
  if (!boardElement) return;
  boardElement.style.gridTemplateColumns = visibleCount > 0 
    ? `repeat(${visibleCount}, 1fr)` 
    : 'none';
}

// Inicializar menú de visibilidad de columnas
function initColumnsToggle() {
  const btnColumns = document.getElementById('btn-columns');
  const kanbanBoard = document.querySelector('.kanban-board');

  if (!btnColumns || !kanbanBoard) return;

  // Evitar duplicaciones DOM
  if (document.getElementById('columns-toggle-menu')) return;

  // Contenedor del menú
  const menu = document.createElement('div');
  menu.id = 'columns-toggle-menu';
  menu.style.cssText = `
    display: none;
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 6px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    padding: 10px 14px;
    z-index: 200;
    flex-direction: column;
    gap: 8px;
    min-width: 180px;
  `;

  const columns = kanbanBoard.querySelectorAll('.kanban-column');

  // Opciones del menú
  columns.forEach((col, index) => {
    const h2Element = col.querySelector('.column-header h2')
    let rawText = '';
    if (h2Element) {
      h2Element.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          rawText += node.textContent.trim();
        }
      });
    }

    // Por defecto
    const statusName = rawText || `${index + 1}`;
    const columnTitle = `Columna ${statusName}`;

    const label = document.createElement('label');
    label.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: #374151;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;

    checkbox.addEventListener('change', (e) => {
      col.style.display = e.target.checked ? 'flex' : 'none';
      const visibleCount = Array.from(columns).filter(c => c.style.display !== 'none').length;
      updateBoardGrid(kanbanBoard, visibleCount);
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(columnTitle));
    menu.appendChild(label);
  });

  // Posicionamiento relativo en el contenedor padre
  btnColumns.parentNode.style.position = 'relative';
  btnColumns.parentNode.appendChild(menu);

  // Manejadores de eventos
  btnColumns.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleColumnsMenu(menu);
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== btnColumns) {
      menu.style.display = 'none';
    }
  });
}

// Función para el filtro de tareas por título
function initTaskFilter() {
  const filterInput = document.getElementById('task-filter-input');
  if (!filterInput) return;

  filterInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const taskCards = document.querySelectorAll('.task-card');

    taskCards.forEach(card => {
      const titleElement = card.querySelector('.task-title') || card.querySelector('h3');
      const titleText = titleElement ? titleElement.textContent.toLowerCase() : '';

      card.style.display = titleText.includes(query) ? '' : 'none';
    });
  });
}

// Inicialización de SortableJS para Drag and Drop
function initSortable() {
  const options = {
    group: 'kanban',
    animation: 150,
    ghostClass: 'sortable-ghost',
    onEnd: async (evt) => {
      const taskId = evt.item.dataset.id;
      const newStatus = evt.to.parentElement.id.replace('col-', '');

      if (evt.from !== evt.to) {
        await updateTaskStatus(taskId, newStatus);
      }
    }
  };

  if (DOM.columns.do) new Sortable(DOM.columns.do, options);
  if (DOM.columns.doing) new Sortable(DOM.columns.doing, options);
  if (DOM.columns.done) new Sortable(DOM.columns.done, options);
}

// Escuchadores de Eventos
function setupEventListeners() {
  // Modal Crear Tarea
  DOM.btnNewTask?.addEventListener('click', () => openModal(DOM.modalCreate));
  DOM.btnCloseCreate?.addEventListener('click', () => closeModal(DOM.modalCreate));
  DOM.formCreate?.addEventListener('submit', handleCreateTask);

  // Botones "Añadir tarea" en cada columna
  document.querySelectorAll('.add-card-btn, .btn-add-task-full').forEach(btn => {
    btn.addEventListener('click', () => openModal(DOM.modalCreate));
  });

  // Modal Detalle / Edición (Ventana Flotante)
  DOM.btnCloseDetail?.addEventListener('click', () => closeModal(DOM.modalDetail));
  DOM.formEdit?.addEventListener('submit', handleEditTask);
  DOM.btnDeleteTask?.addEventListener('click', handleDeleteTask);

  // Actualiza el badge en tiempo real
  DOM.detailPriority?.addEventListener('change', (e) => {
    updateDetailPriorityBadge(e.target.value);
  });

  // Cierre al hacer clic fuera de la tarjeta
  [DOM.modalCreate, DOM.modalDetail].forEach(modal => {
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Cierre con la tecla ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(DOM.modalCreate);
      closeModal(DOM.modalDetail);
    }
  });

  // Formulario de Comentarios
  DOM.formComment?.addEventListener('submit', handleAddComment);

  // Filtros y Búsqueda
  DOM.searchInput?.addEventListener('input', renderBoard);
  DOM.priorityFilter?.addEventListener('change', renderBoard);

  DOM.btnFilterAll?.addEventListener('click', () => setQuickFilter('ALL'));
  DOM.btnFilterAssigned?.addEventListener('click', () => setQuickFilter('ASSIGNED'));
  DOM.btnFilterPriority?.addEventListener('click', () => setQuickFilter('PRIORITY'));
}

// Peticiones API
async function fetchTasks() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al conectar con la API');
    tasks = await res.json();

    if (DOM.pingLabel) {
      DOM.pingLabel.textContent = 'Conectado';
      DOM.pingLabel.style.color = '#10B981';
    }
    renderBoard();
  } catch (err) {
    console.error(err);
    if (DOM.pingLabel) {
      DOM.pingLabel.textContent = 'Desconectado';
      DOM.pingLabel.style.color = '#EF4444';
    }
  }
}

// Renderizado del Tablero
function renderBoard() {
  // Limpiar columnas
  Object.values(DOM.columns).forEach(col => { if (col) col.innerHTML = ''; });

  // Capturar texto e input de prioridad
  const search = DOM.searchInput ? DOM.searchInput.value.toLowerCase().trim() : '';
  const prioritySelect = DOM.priorityFilter ? DOM.priorityFilter.value : 'ALL';

  const filteredTasks = tasks.filter(task => {
    // Coincidencias en título, descripción e ID
    const titleMatch = (task.title || '').toLowerCase().includes(search);
    const descMatch = (task.description || '').toLowerCase().includes(search);
    const idMatch = String(task.id).toLowerCase().includes(search);
    const matchesSearch = titleMatch || descMatch || idMatch;

    // Filtros de prioridad
    const matchesPriority = prioritySelect === 'ALL' || task.priority === prioritySelect;

    // Filtros rápidos
    let matchesQuick = true;
    if (activeFilter === 'ASSIGNED') matchesQuick = Boolean(task.assigned);
    if (activeFilter === 'PRIORITY') matchesQuick = task.priority === 'Alta' || task.priority === 'high';

    return matchesSearch && matchesPriority && matchesQuick;
  });

  // Renderizar tarjetas filtradas
  filteredTasks.forEach(task => {
    const card = createCardElement(task);
    const statusKey = (task.status || 'todo').replace('col-', '').replace('todo', 'do');
    if (DOM.columns[statusKey]) {
      DOM.columns[statusKey].appendChild(card);
    }
  });

  updateStats();
}

function createCardElement(task) {
  const taskNumber = tasks.findIndex(t => t.id === task.id) + 1;

  const article = document.createElement('article');
  article.className = 'task-card';
  article.dataset.id = task.id;

  const priorityMap = {
    'alta': 'high',
    'media': 'medium',
    'baja': 'low',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };

  const rawPriority = (task.priority || 'Baja').toLowerCase().trim();
  const priorityClass = priorityMap[rawPriority] || 'low';

  const commentsCount = task.comments ? task.comments.length : 0;
  const initial = task.assigned ? task.assigned.charAt(0).toUpperCase() : 'U';

  article.innerHTML = `
    <div class="card-header">
      <span class="task-id">Tarea-${taskNumber}</span>
      <span class="badge-priority ${priorityClass}">${escapeHTML(task.priority || 'Baja')}</span>
    </div>
    <h3>${escapeHTML(task.title || '')}</h3>
    <p class="task-desc">${escapeHTML(task.description || '')}</p>
    <div class="card-footer">
      <span class="task-date">
        <span class="material-symbols-outlined">calendar_today</span>
        ${task.date || 'Sin fecha'}
      </span>
      <div class="card-right">
        <span class="comments">
          <span class="material-symbols-outlined">chat_bubble</span>${commentsCount}
        </span>
      </div>
      <div class="user-avatar-mini">${initial}</div>
    </div>
  `;

  article.addEventListener('click', () => openDetailModal(task.id));
  return article;
}

//Carga de pantallas externas

async function loadModalContent(url, containerElement) {
  if (!containerElement) return false;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error al cargar ${url}`);
    const htmlContent = await response.text();
    containerElement.innerHTML = htmlContent;
    return true;
  } catch (error) {
    console.error('Error al cargar la plantilla modal:', error);
    return false;
  }
}

// Abrir el html de detalles de la tarea 
async function openTaskDetailsModal(taskId) {
  const modalContainer = document.getElementById('task-modal-body');
  const modalOverlay = document.getElementById('task-modal-overlay');

  const loaded = await loadModalContent('task-details.html', modalContainer);
  if (loaded) {
    openDetailModal(taskId);
  } else if (modalOverlay) {
    if (DOM && DOM.modalDetail) {
      openDetailModal(taskId);
    } else {
      modalOverlay.style.display = 'flex';
    }
  }
}

// Abrir el html externo de asignación de tarea 
async function openTaskAssignModal(taskId) {
  const modalContainer = document.getElementById('task-modal-body');
  const modalOverlay = document.getElementById('task-modal-overlay');

  const loaded = await loadModalContent('task-assign.html', modalContainer);
  if (loaded) {
    if (DOM && DOM.modalCreate) {
      openModal(DOM.modalCreate);
    } else if (modalOverlay) {
      modalOverlay.style.display = 'flex';
    }
  } else if (modalOverlay) {
    modalOverlay.style.display = 'flex';
  }
}

// Modal Detalle (Ventana Flotante)
function openDetailModal(id) {
  const task = tasks.find(t => String(t.id) === String(id));
  if (!task) return;
  const taskNumber = tasks.findIndex(t => String(t.id) === String(id)) + 1;

  if (DOM.detailTaskId) DOM.detailTaskId.value = task.id;
  if (DOM.detailCardId) DOM.detailCardId.textContent = `Tarea-${taskNumber}`;
  if (DOM.detailTitle) DOM.detailTitle.value = task.title || '';
  if (DOM.detailStatus) DOM.detailStatus.value = task.status || 'do';
  if (DOM.detailPriority) DOM.detailPriority.value = task.priority || 'Baja';
  if (DOM.detailDate) DOM.detailDate.value = task.date || '';
  if (DOM.detailDescription) DOM.detailDescription.value = task.description || '';

  updateDetailPriorityBadge(task.priority || 'Baja');
  renderComments(task);

  const targetModal = DOM.modalDetail || document.getElementById('task-modal-overlay');
  openModal(targetModal);
}

// Función para cambiar el texto y color del Badge en detalles
function updateDetailPriorityBadge(priorityText) {
  const badge = document.getElementById('detail-priority-badge');
  if (!badge) return;

  const safePriority = priorityText ? String(priorityText) : 'Baja';
  const cleanPriority = safePriority.toLowerCase().trim();

  const priorityMap = {
    'alta': 'high',
    'media': 'medium',
    'baja': 'low',
    'high': 'high',
    'medium': 'medium',
    'low': 'low'
  };

  const cssClass = priorityMap[cleanPriority] || 'low';

  badge.textContent = safePriority;
  badge.className = `badge-priority ${cssClass}`;
}

// Control de Ventanas Flotantes
function openModal(modal) {
  if (!modal) return;
  modal.removeAttribute('hidden');
  modal.classList.remove('modal-hidden');
  modal.classList.add('active');

  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '9999';

  document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.add('modal-hidden');
  modal.classList.remove('active');
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

// Crear Tarea
async function handleCreateTask(e) {
  e.preventDefault();
  const newTask = {
    title: document.getElementById('create-title').value,
    description: document.getElementById('create-description').value,
    priority: document.getElementById('create-priority').value,
    date: document.getElementById('create-date').value,
    assigned: document.getElementById('create-assigned').value,
    status: 'do',
    comments: []
  };

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    if (res.ok) {
      const savedTask = await res.json();
      tasks.push(savedTask);
      renderBoard();
      closeModal(DOM.modalCreate || document.getElementById('task-modal-overlay'));
      if (DOM.formCreate) DOM.formCreate.reset();
    }
  } catch (err) {
    console.error('Error al crear la tarea:', err);
  }
}

// Guardar Cambios de Tarea
async function handleEditTask(e) {
  e.preventDefault();
  const id = DOM.detailTaskId.value;
  const index = tasks.findIndex(t => String(t.id) === String(id));
  if (index === -1) return;

  const updatedData = {
    ...tasks[index],
    title: DOM.detailTitle.value,
    status: DOM.detailStatus.value,
    priority: DOM.detailPriority.value,
    date: DOM.detailDate.value,
    description: DOM.detailDescription.value
  };

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    if (res.ok) {
      tasks[index] = updatedData;
      renderBoard();
      closeModal(DOM.modalDetail || document.getElementById('task-modal-overlay'));
    }
  } catch (err) {
    console.error('Error al actualizar la tarea:', err);
  }
}

// Eliminar Tarea
async function handleDeleteTask() {
  const id = DOM.detailTaskId.value;
  if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) return;

  try {
    const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (res.ok) {
      tasks = tasks.filter(t => String(t.id) !== String(id));
      renderBoard();
      closeModal(DOM.modalDetail || document.getElementById('task-modal-overlay'));
    }
  } catch (err) {
    console.error('Error al eliminar la tarea:', err);
  }
}

// Actualizar Estado Drag & Drop
async function updateTaskStatus(id, newStatus) {
  const task = tasks.find(t => String(t.id) === String(id));
  if (!task) return;

  task.status = newStatus;
  try {
    await fetch(`${API_URL}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    updateStats();
  } catch (err) {
    console.error('Error al actualizar el estado:', err);
  }
}

//COMENTARIOS 

function renderComments(task) {
  const commentsContainer = DOM.detailCommentsList || document.getElementById('detail-comments-list');
  if (!commentsContainer) return;

  commentsContainer.innerHTML = '';
  const comments = task.comments || [];

  if (comments.length === 0) {
    commentsContainer.innerHTML = '<p class="comment-empty-message">No hay comentarios.</p>';
    return;
  }

  comments.forEach((c, index) => {
    const commentText = typeof c === 'string' ? c : (c.text || '');
    const div = document.createElement('div');
    div.className = 'comment-item-container';

    div.innerHTML = `
      <div class="comment-view-wrapper" id="comment-view-${index}">
        <div class="comment-box">
          <p class="comment-text">${escapeHTML(commentText)}</p>
        </div>

        <div class="comment-actions-bar">
          <div>
            <button type="button" class="btn-edit-comment">
              <span class="material-symbols-outlined">edit</span> Editar
            </button>
          </div>

          <div>
            <button type="button" class="btn-delete-comment" title="Eliminar comentario">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>

      <div class="comment-edit-wrapper" id="comment-edit-${index}">
        <textarea class="edit-comment-input">${escapeHTML(commentText)}</textarea>

        <div class="comment-actions-bar">

          <div class="comment-actions-left">
            <button type="button" class="btn-save-comment">Guardar</button>
            <button type="button" class="btn-cancel-comment">Cancelar</button>
          </div>

          <div>
            <button type="button" class="btn-delete-edit-comment" title="Eliminar comentario">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const btnEdit = div.querySelector('.btn-edit-comment');
    const btnDeleteView = div.querySelector('.btn-delete-comment');
    const btnDeleteEdit = div.querySelector('.btn-delete-edit-comment');
    const btnSave = div.querySelector('.btn-save-comment');
    const btnCancel = div.querySelector('.btn-cancel-comment');
    const viewWrapper = div.querySelector(`#comment-view-${index}`);
    const editWrapper = div.querySelector(`#comment-edit-${index}`);
    const textarea = div.querySelector('.edit-comment-input');

    btnEdit.addEventListener('click', () => {
      viewWrapper.style.display = 'none';
      editWrapper.style.display = 'block';
      textarea.focus();
    });

    btnCancel.addEventListener('click', () => {
      editWrapper.style.display = 'none';
      viewWrapper.style.display = 'block';
      textarea.value = commentText;
    });

    const deleteCommentHandler = async () => {
      if (!confirm('¿Deseas eliminar este comentario?')) return;

      task.comments.splice(index, 1);
      const success = await saveCommentsToAPI(task.id, task.comments);
      if (success) {
        renderComments(task);
        renderBoard();
      }
    };

    btnDeleteView.addEventListener('click', deleteCommentHandler);
    btnDeleteEdit.addEventListener('click', deleteCommentHandler);

    btnSave.addEventListener('click', async () => {
      const newText = textarea.value.trim();
      if (!newText) return;

      if (typeof task.comments[index] === 'string') {
        task.comments[index] = newText;
      } else {
        task.comments[index].text = newText;
      }

      const success = await saveCommentsToAPI(task.id, task.comments);
      if (success) {
        renderComments(task);
        renderBoard();
      }
    });

    commentsContainer.appendChild(div);
  });
}

// Publicar un nuevo comentario
async function handleAddComment(e) {
  e.preventDefault();
  const id = DOM.detailTaskId.value;
  const text = DOM.inputComment.value.trim();
  if (!text) return;

  const task = tasks.find(t => String(t.id) === String(id));
  if (!task) return;

  if (!task.comments) task.comments = [];
  task.comments.push(text);

  const success = await saveCommentsToAPI(id, task.comments);
  if (success) {
    renderComments(task);
    DOM.inputComment.value = '';
    renderBoard();
  }
}

// Guardar array de comentarios en json-server
async function saveCommentsToAPI(taskId, commentsArray) {
  try {
    const res = await fetch(`${API_URL}/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments: commentsArray })
    });
    return res.ok;
  } catch (err) {
    console.error('Error al guardar comentarios:', err);
    return false;
  }
}

// Métricas de Rendimiento
function updateStats() {
  const total = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'doing').length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const statValues = document.querySelectorAll('.stat-value');
  if (statValues.length >= 4) {
    statValues[0].textContent = total;
    statValues[1].textContent = inProgress;
    statValues[2].textContent = completed;
    statValues[3].textContent = `${rate}%`;
  }
}

// Filtros Rápidos
function setQuickFilter(type) {
  activeFilter = type;
  [DOM.btnFilterAll, DOM.btnFilterAssigned, DOM.btnFilterPriority].forEach(btn => {
    btn?.classList.remove('active');
  });
  if (type === 'ALL') DOM.btnFilterAll?.classList.add('active');
  if (type === 'ASSIGNED') DOM.btnFilterAssigned?.classList.add('active');
  if (type === 'PRIORITY') DOM.btnFilterPriority?.classList.add('active');
  renderBoard();
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g,
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}