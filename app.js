// Inicialização
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let chart = null;
let lastDeleted = null; // para funcionalidade de undo
let undoTimeout = null;
let filters = { search: '', category: '', status: '' };

// Categorias para estilização
const categories = {
    atendimento: { color: '#007bff' },
    análise: { color: '#28a745' },
    estudos: { color: '#ffc107' },
    consultas: { color: '#dc3545' }
};

// Função para salvar tarefas
function saveTasks() {
    try {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        setStatus('Tarefas salvas.');
    } catch (e) {
        console.error('Erro ao salvar tarefas:', e);
        alert('Não foi possível salvar as tarefas localmente. Considere exportá-las.');
    }
}

function setStatus(msg) {
    const region = document.getElementById('statusRegion');
    if (region) {
        region.textContent = msg;
        // Mantém visual hidden para leitores, mas limpa depois
        setTimeout(() => { if (region) region.textContent = ''; }, 3000);
    }
}

// Exportar / Importar
function exportTasks() {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tarefas.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus('Exportação iniciada.');
}

function importTasksFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const imported = JSON.parse(reader.result);
            if (Array.isArray(imported)) {
                tasks = imported;
                saveTasks();
                renderTasks();
                setStatus('Importação concluída.');
            } else {
                alert('Arquivo inválido: formato incorreto');
            }
        } catch (e) {
            alert('Arquivo inválido: não foi possível parsear JSON');
        }
    };
    reader.readAsText(file);
}

// Função para renderizar lista de tarefas
function renderTasks() {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    // Empty state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) emptyState.remove();

    // Aplicar filtros
    const visibleTasks = tasks.filter(t => {
        // search
        if (filters.search) {
            const s = filters.search.toLowerCase();
            const title = (t.title || '').toLowerCase();
            if (!title.includes(s)) return false;
        }
        // category
        if (filters.category) {
            if (t.category !== filters.category) return false;
        }
        // status
        if (filters.status) {
            if (filters.status === 'completed' && !t.completed) return false;
            if (filters.status === 'pending' && t.completed) return false;
        }
        return true;
    });

    visibleTasks.forEach((task) => {
        const index = tasks.findIndex(tt => tt.id === task.id);
        const li = document.createElement('li');
        li.className = `list-group-item task-card ${task.category} d-flex justify-content-between align-items-center`;
        li.setAttribute('role', 'listitem');

        // Verificar se está atrasada
        const now = new Date();
        const deadline = task.deadline ? new Date(task.deadline) : null;
        if (task.deadline && now > deadline && !task.completed) {
            li.classList.add('overdue');
        }

        // Conteúdo seguro usando textContent
        const left = document.createElement('div');
        const titleEl = document.createElement('h6');
        titleEl.textContent = task.title || '(sem título)';
        const catEl = document.createElement('small');
        const catLabel = task.category ? (task.category.charAt(0).toUpperCase() + task.category.slice(1)) : '—';
        catEl.textContent = `Categoria: ${catLabel}`;
        left.appendChild(titleEl);
        left.appendChild(catEl);
        left.appendChild(document.createElement('br'));
        if (task.deadline) {
            const deadlineEl = document.createElement('small');
            const d = new Date(task.deadline);
            deadlineEl.textContent = `Prazo: ${d.toLocaleString('pt-BR')}`;
            left.appendChild(deadlineEl);
            left.appendChild(document.createElement('br'));
        }
        if (task.completed) {
            const doneEl = document.createElement('small');
            doneEl.className = 'text-success';
            doneEl.textContent = 'Concluída';
            left.appendChild(doneEl);
        }

        const right = document.createElement('div');
        // Concluir
        if (!task.completed) {
            const completeBtn = document.createElement('button');
            completeBtn.className = 'btn btn-success btn-sm me-2';
            completeBtn.textContent = 'Concluir';
            completeBtn.type = 'button';
            completeBtn.setAttribute('aria-label', `Concluir tarefa ${task.title}`);
            completeBtn.addEventListener('click', () => toggleComplete(index));
            right.appendChild(completeBtn);
        }

        // Editar
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-warning btn-sm me-2';
        editBtn.textContent = 'Editar';
        editBtn.type = 'button';
        editBtn.setAttribute('aria-label', `Editar tarefa ${task.title}`);
        editBtn.addEventListener('click', () => editTask(index));
        right.appendChild(editBtn);

        // Deletar
    const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-sm';
        deleteBtn.textContent = 'Deletar';
        deleteBtn.type = 'button';
        deleteBtn.setAttribute('aria-label', `Deletar tarefa ${task.title}`);
    deleteBtn.addEventListener('click', () => deleteTask(index));
        right.appendChild(deleteBtn);

        li.appendChild(left);
        li.appendChild(right);
        taskList.appendChild(li);
    });

    // Se não houver tarefas, mostra empty state
    if (tasks.length === 0) {
        const empty = document.createElement('div');
        empty.id = 'emptyState';
        empty.className = 'text-center p-4';
        empty.innerHTML = `
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 11l3 3L22 4" stroke="#e6f7ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <p class="mt-3">Você ainda não tem tarefas.</p>
            <button id="ctaAdd" class="btn btn-primary">Adicionar Tarefa</button>
        `;
    const listParent = taskList.parentElement; // deve ser o container dentro do card-body das tarefas
    if (listParent) listParent.appendChild(empty);
        const cta = document.getElementById('ctaAdd');
        if (cta) cta.addEventListener('click', () => document.getElementById('taskTitle').focus());
    }

    updateProgress();
    // Sincronizar select do Pomodoro (se inicializado)
    if (window.refreshPomodoroSelect) window.refreshPomodoroSelect();
}

// Adicionar tarefa
document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value;
    const category = document.getElementById('taskCategory').value;
    const deadline = document.getElementById('taskDeadline').value;

    const task = {
        id: Date.now(),
        title,
        category,
        deadline,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(task); // Adiciona no topo
    saveTasks();
    renderTasks();

    // Agendar notificação se houver prazo
    if (deadline) {
        scheduleNotification(task);
    }

    // Limpar form
    e.target.reset();
});

// Debounce util
function debounce(fn, wait) {
    let t;
    return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

// Ligar busca/filtros
const searchInput = document.getElementById('taskSearch');
const categoryFilter = document.getElementById('filterCategory');
const statusFilter = document.getElementById('filterStatus');
const clearFiltersBtn = document.getElementById('clearFilters');

function applyFiltersFromUI() {
    filters.search = (searchInput && searchInput.value) ? searchInput.value.trim() : '';
    filters.category = (categoryFilter && categoryFilter.value) ? categoryFilter.value : '';
    filters.status = (statusFilter && statusFilter.value) ? statusFilter.value : '';
    renderTasks();
}

if (searchInput) searchInput.addEventListener('input', debounce(applyFiltersFromUI, 250));
if (categoryFilter) categoryFilter.addEventListener('change', applyFiltersFromUI);
if (statusFilter) statusFilter.addEventListener('change', applyFiltersFromUI);
if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    filters = { search: '', category: '', status: '' };
    renderTasks();
});

// Toggle concluída
function toggleComplete(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

// Editar tarefa (simples: reabre form com valores)
function editTask(index) {
    const task = tasks[index];
    document.getElementById('taskTitle').value = task.title;
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskDeadline').value = task.deadline ? task.deadline.slice(0, 16) : '';

    // Remove a tarefa atual e deixa o usuário adicionar editada
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

// Deletar tarefa
function deleteTask(index) {
    if (!confirm('Deletar esta tarefa?')) return;
    // armazenar para undo
    lastDeleted = { item: tasks[index], index };
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
    // criar undo temporário de 8s
    setStatus('Tarefa deletada. <button id="undoBtn" class="btn btn-link btn-sm">Desfazer</button>');
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.addEventListener('click', () => {
        if (lastDeleted) {
            tasks.splice(lastDeleted.index, 0, lastDeleted.item);
            saveTasks();
            renderTasks();
            lastDeleted = null;
            setStatus('A exclusão foi desfeita.');
            clearTimeout(undoTimeout);
        }
    });
    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => { lastDeleted = null; setStatus(''); }, 8000);
}

// Agendar notificação (10 min antes do prazo)
function scheduleNotification(task) {
    if (!("Notification" in window)) return;

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            const deadline = new Date(task.deadline);
            const notifyTime = new Date(deadline.getTime() - 10 * 60000); // 10 min antes
            const now = new Date();

            if (notifyTime > now) {
                setTimeout(() => {
                    new Notification('Lembrete de Tarefa', {
                        body: `Tarefa "${task.title}" vence em 10 minutos!`,
                        icon: 'https://via.placeholder.com/32?text=🔔'
                    });
                }, notifyTime - now);
            }
        }
    });
}

// Atualizar progresso
function updateProgress() {
    const today = new Date().toDateString();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Início da semana

    const dailyCompleted = tasks.filter(t =>
        t.completed && new Date(t.createdAt).toDateString() === today
    ).length;
    const dailyTotal = tasks.filter(t => new Date(t.createdAt).toDateString() === today).length;

    const weeklyCompleted = tasks.filter(t =>
        t.completed && new Date(t.createdAt) >= weekStart
    ).length;
    const weeklyTotal = tasks.filter(t => new Date(t.createdAt) >= weekStart).length;

    document.getElementById('dailyProgress').textContent = `${dailyCompleted}/${dailyTotal}`;
    document.getElementById('weeklyProgress').textContent = `${weeklyCompleted}/${weeklyTotal}`;

    // Gráfico simples (pizza para progresso semanal)
    const canvas = document.getElementById('progressChart');
    const ctx = canvas.getContext('2d');
    if (chart) chart.destroy();
    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Concluídas', 'Pendentes'],
            datasets: [{
                data: [weeklyCompleted, Math.max(0, weeklyTotal - weeklyCompleted)],
                backgroundColor: ['#28a745', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // permitir que o canvas ocupe o tamanho do container
            cutout: '70%', // aumentar o recorte central para um anel mais fino
            plugins: { legend: { display: false } }
        }
    });
}

// Inicializar app
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register('sw.js'); // Para PWA offline (crie sw.js vazio por enquanto)
    }
    // Ligar botões Export/Import
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    if (exportBtn) exportBtn.addEventListener('click', exportTasks);
    if (importBtn && importFile) importBtn.addEventListener('click', () => importFile.click());
    if (importFile) importFile.addEventListener('change', (e) => importTasksFile(e.target.files[0]));
    // Inicializar Pomodoro
    initPomodoro();
});

// ------------------ Pomodoro / Foco do Dia ------------------
let pomodoro = {
    work: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    interval: null,
    remaining: 25 * 60,
    running: false,
    mode: 'work',
    sessionsToday: 0
};

function initPomodoro() {
    const select = document.getElementById('focusTaskSelect');
    const startBtn = document.getElementById('focusStart');
    const pauseBtn = document.getElementById('focusPause');
    const resetBtn = document.getElementById('focusReset');
    const timerEl = document.getElementById('focusTimer');
    const modeEl = document.getElementById('focusMode');
    const sessionsEl = document.getElementById('focusSessions');

    // Preencher select com tarefas
    function refreshSelect() {
        if (!select) return;
        const current = select.value;
        select.innerHTML = '<option value="">— Selecionar tarefa —</option>';
        tasks.forEach((t) => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.title || '(sem título)';
            select.appendChild(opt);
        });
        if (current) select.value = current;
    }

    refreshSelect();

    // Atualizar display
    function formatTime(s) {
        const m = Math.floor(s / 60).toString().padStart(2, '0');
        const sec = (s % 60).toString().padStart(2, '0');
        return `${m}:${sec}`;
    }

    function updateDisplay() {
        if (timerEl) timerEl.textContent = formatTime(pomodoro.remaining);
        if (modeEl) modeEl.textContent = `Modo: ${pomodoro.mode === 'work' ? 'Pomodoro' : (pomodoro.mode === 'shortBreak' ? 'Pausa curta' : 'Pausa longa')}`;
        if (sessionsEl) sessionsEl.textContent = pomodoro.sessionsToday;
    }

    function tick() {
        if (pomodoro.remaining <= 0) {
            // completar ciclo
            clearInterval(pomodoro.interval);
            pomodoro.running = false;
            // notificar
            setStatus('Ciclo concluído!');
            tryNotify('Pomodoro concluído', 'Hora de fazer uma pausa!');
            // Marcar tarefa se opção marcada
            const completeOnFinish = document.getElementById('completeOnFinish');
            const selectedId = select ? select.value : null;
            if (completeOnFinish && completeOnFinish.checked && selectedId) {
                const idx = tasks.findIndex(t => String(t.id) === String(selectedId));
                if (idx !== -1) {
                    tasks[idx].completed = true;
                    saveTasks();
                    renderTasks();
                }
            }
            pomodoro.sessionsToday += (pomodoro.mode === 'work') ? 1 : 0;
            // alternar modo
            if (pomodoro.mode === 'work') {
                // após 4 sessões, longBreak
                if (pomodoro.sessionsToday % 4 === 0) {
                    pomodoro.mode = 'longBreak';
                    pomodoro.remaining = pomodoro.longBreak;
                } else {
                    pomodoro.mode = 'shortBreak';
                    pomodoro.remaining = pomodoro.shortBreak;
                }
            } else {
                pomodoro.mode = 'work';
                pomodoro.remaining = pomodoro.work;
            }
            updateDisplay();
            // auto iniciar próximo ciclo? não, deixa o usuário decidir
            return;
        }
        pomodoro.remaining -= 1;
        updateDisplay();
    }

    // controles
    if (startBtn) startBtn.addEventListener('click', () => {
        if (!pomodoro.running) {
            pomodoro.running = true;
            pomodoro.interval = setInterval(tick, 1000);
            setStatus('Pomodoro iniciado');
        }
    });
    if (pauseBtn) pauseBtn.addEventListener('click', () => {
        if (pomodoro.running) {
            clearInterval(pomodoro.interval);
            pomodoro.running = false;
            setStatus('Pomodoro pausado');
        }
    });
    if (resetBtn) resetBtn.addEventListener('click', () => {
        clearInterval(pomodoro.interval);
        pomodoro.running = false;
        pomodoro.mode = 'work';
        pomodoro.remaining = pomodoro.work;
        pomodoro.sessionsToday = 0;
        updateDisplay();
        setStatus('Pomodoro resetado');
    });

    // atualizar select quando tarefas mudarem: observe localStorage via saveTasks chamar renderTasks -> initPomodoro pode ser chamado novamente, mas para simplicidade oferecemos função pública refresh
    window.refreshPomodoroSelect = refreshSelect;
    updateDisplay();
}

function tryNotify(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(p => { if (p === 'granted') new Notification(title, { body }); });
    }
}
