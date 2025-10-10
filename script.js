// script.js

// Constantes
const TASK_CATEGORIES = {
    water: { label: 'Beber Água', points: 10, icon: 'fas fa-tint' },
    study: { label: 'Estudar', points: 30, icon: 'fas fa-book-open' },
    train: { label: 'Treinar', points: 25, icon: 'fas fa-dumbbell' },
    work: { label: 'Trabalho', points: 20, icon: 'fas fa-briefcase' },
    other: { label: 'Outro', points: 10, icon: 'fas fa-bolt' },
}

const BADGES = [
    { id: 'first_task', name: 'Primeira Tarefa', description: 'Complete sua primeira tarefa', icon: 'fas fa-trophy', type: 'tasks', requirement: 1 },
    { id: 'weekly_warrior', name: 'Guerreiro da Semana', description: '7 dias consecutivos', icon: 'fas fa-fire', type: 'streak', requirement: 7 },
    { id: 'task_master', name: 'Mestre das Tarefas', description: '50 tarefas', icon: 'fas fa-star', type: 'tasks', requirement: 50 },
    { id: 'club_100', name: 'Clube dos 100', description: '100 tarefas', icon: 'fas fa-medal', type: 'tasks', requirement: 100 },
    { id: 'points_king', name: 'Rei dos Pontos', description: '500 pontos', icon: 'fas fa-crown', type: 'points', requirement: 500 },
]

// Estado do aplicativo
let currentDate = new Date()
let tasks = {}
let stats = {
    totalPoints: 0,
    totalTasks: 0,
    streak: 0,
    earnedBadges: [],
}

// Elementos do DOM
const todayPointsEl = document.getElementById('today-points')
const completedTasksEl = document.getElementById('completed-tasks')
const streakEl = document.getElementById('streak')
const earnedBadgesEl = document.getElementById('earned-badges')
const currentDayEl = document.getElementById('current-date')
const todayLabelEl = document.getElementById('today-label')
const taskTimelineEl = document.getElementById('task-timeline')
const prevDayBtn = document.getElementById('prev-day')
const nextDayBtn = document.getElementById('next-day')
const addTaskBtn = document.querySelector('.btn-add-task')
const modal = document.getElementById('add-task-modal')
const modalCloseBtn = document.querySelector('.modal-close-btn')
const taskTitleInput = document.getElementById('task-title')
const taskCategorySelect = document.getElementById('task-category')
const taskTimeInput = document.getElementById('task-time')
const taskPointsInput = document.getElementById('task-points')
const createNewTaskBtn = document.querySelector('.btn-create-task')
const dailyHistoryEl = document.getElementById('daily-history')
const badgesListEl = document.getElementById('badges-list')
const totalPoints7DaysEl = document.getElementById('total-points-7-days')
const totalTasks7DaysEl = document.getElementById('total-tasks-7-days')

// Funções Utilitárias
const formatDateKey = (date) => date.toISOString().split('T')[0]

const getDayName = (date) => {
    const options = { weekday: 'long' }
    return date.toLocaleDateString('pt-BR', options)
}

const getFormattedDate = (date) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    return date.toLocaleDateString('pt-BR', options)
}

const saveState = () => {
    localStorage.setItem('dailyTasksApp_tasks', JSON.stringify(tasks))
    localStorage.setItem('dailyTasksApp_stats', JSON.stringify(stats))
}

const loadState = () => {
    const savedTasks = localStorage.getItem('dailyTasksApp_tasks')
    const savedStats = localStorage.getItem('dailyTasksApp_stats')
    if (savedTasks) {
        tasks = JSON.parse(savedTasks)
    }
    if (savedStats) {
        stats = JSON.parse(savedStats)
    }
}

// Renderização
const renderTasks = () => {
    const dateKey = formatDateKey(currentDate)
    const dayTasks = tasks[dateKey] || []
    taskTimelineEl.innerHTML = ''

    if (dayTasks.length === 0) {
        taskTimelineEl.innerHTML = `
            <div class="text-center text-muted-foreground py-8">
                <i class="fas fa-clock text-4xl mb-4"></i>
                <p>Nenhuma tarefa para este dia</p>
                <p>Clique no + para adicionar</p>
            </div>
        `
    } else {
        dayTasks.sort((a, b) => a.time.localeCompare(b.time))
        dayTasks.forEach(task => {
            const CategoryIcon = TASK_CATEGORIES[task.category].icon
            const taskEl = document.createElement('div')
            taskEl.className = `task-card p-4 rounded-lg cursor-pointer transition-all ${task.completed ? 'completed' : ''}`
            taskEl.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="icon-wrapper p-2 rounded-full ${task.completed ? 'bg-primary' : 'bg-muted'}">
                        <i class="${CategoryIcon}"></i>
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center justify-between">
                            <h3 class="font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}">
                                ${task.title}
                            </h3>
                            <div class="flex items-center space-x-2">
                                <span class="badge ${task.completed ? 'default' : 'secondary'}">
                                    ${task.points} pts
                                </span>
                                <button class="btn-icon-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 delete-task-btn" data-task-id="${task.id}">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2 mt-1">
                            <span class="text-sm text-muted-foreground">${task.time}</span>
                            <span class="text-sm text-muted-foreground">•</span>
                            <span class="text-sm text-muted-foreground">
                                ${TASK_CATEGORIES[task.category].label}
                            </span>
                        </div>
                    </div>
                    ${task.completed ? '<i class="fas fa-check-circle h-5 w-5 text-primary"></i>' : ''}
                </div>
            `
            taskEl.addEventListener('click', (e) => toggleTask(task.id, e))
            taskEl.querySelector('.delete-task-btn').addEventListener('click', (e) => deleteTask(task.id, e))
            taskTimelineEl.appendChild(taskEl)
        })
    }
    updateStatsDisplay()
    renderBadges()
    renderDailyHistory()
}

const updateHeaderDate = () => {
    currentDayEl.textContent = getFormattedDate(currentDate)
    const today = new Date()
    if (formatDateKey(currentDate) === formatDateKey(today)) {
        todayLabelEl.textContent = 'Hoje'
    } else {
        todayLabelEl.textContent = ''
    }
}

const updateStatsDisplay = () => {
    const dateKey = formatDateKey(currentDate)
    const dayTasks = tasks[dateKey] || []
    const completed = dayTasks.filter(task => task.completed).length
    const todayPoints = dayTasks.filter(task => task.completed).reduce((sum, task) => sum + task.points, 0)

    todayPointsEl.textContent = todayPoints
    completedTasksEl.textContent = `${completed}/${dayTasks.length}`
    streakEl.textContent = `${stats.streak} dias`
    earnedBadgesEl.textContent = `${stats.earnedBadges.length}/5`

    // Estatísticas dos últimos 7 dias
    let totalPointsLast7Days = 0
    let totalTasksLast7Days = 0
    for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(today.getDate() - i)
        const key = formatDateKey(date)
        const dayTasks = tasks[key] || []
        totalPointsLast7Days += dayTasks.filter(task => task.completed).reduce((sum, task) => sum + task.points, 0)
        totalTasksLast7Days += dayTasks.filter(task => task.completed).length
    }
    totalPoints7DaysEl.textContent = totalPointsLast7Days
    totalTasks7DaysEl.textContent = totalTasksLast7Days
}

const renderBadges = () => {
    badgesListEl.innerHTML = ''
    BADGES.forEach(badge => {
        const isEarned = stats.earnedBadges.includes(badge.id)
        const badgeEl = document.createElement('div')
        badgeEl.className = `flex items-center space-x-3 p-3 rounded-lg ${isEarned ? 'bg-primary/10' : 'bg-muted/10'} ${isEarned ? 'text-primary' : 'text-muted-foreground'}`
        badgeEl.innerHTML = `
            <i class="${badge.icon} text-2xl"></i>
            <div>
                <h4 class="font-bold">${badge.name}</h4>
                <p class="text-sm">${badge.description}</p>
            </div>
        `
        badgesListEl.appendChild(badgeEl)
    })
}

const renderDailyHistory = () => {
    dailyHistoryEl.innerHTML = ''
    const today = new Date()
    for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(today.getDate() - i)
        const dateKey = formatDateKey(date)
        const dayTasks = tasks[dateKey] || []
        const completed = dayTasks.filter(task => task.completed).length
        const total = dayTasks.length
        const dayName = getDayName(date).substring(0, 3)

        const historyItem = document.createElement('li')
        historyItem.className = 'flex justify-between items-center py-1'
        historyItem.innerHTML = `
            <span class="text-sm text-muted-foreground">${dayName}, ${date.getDate()}</span>
            <span class="text-sm font-bold ${completed > 0 ? 'text-primary' : 'text-muted-foreground'}">${completed} / ${total}</span>
        `
        dailyHistoryEl.appendChild(historyItem)
    }
}

// Lógica de Tarefas
const addTask = () => {
    const title = taskTitleInput.value.trim()
    const category = taskCategorySelect.value
    const time = taskTimeInput.value
    const points = parseInt(taskPointsInput.value)

    if (!title || !time) {
        alert('Por favor, preencha o título e o horário da tarefa.')
        return
    }

    const dateKey = formatDateKey(currentDate)
    if (!tasks[dateKey]) {
        tasks[dateKey] = []
    }

    const newTask = {
        id: Date.now(),
        title,
        category,
        time,
        points,
        completed: false,
    }
    tasks[dateKey].push(newTask)
    saveState()
    renderTasks()
    modal.classList.add('hidden')
    taskTitleInput.value = ''
    taskTimeInput.value = '09:00'
    taskCategorySelect.value = 'other'
    taskPointsInput.value = TASK_CATEGORIES['other'].points
    checkNewBadges()
}

const toggleTask = (taskId, event) => {
    event.stopPropagation()
    const dateKey = formatDateKey(currentDate)
    const dayTasks = tasks[dateKey] || []

    const taskToUpdate = dayTasks.find(task => task.id === taskId)
    if (!taskToUpdate) return

    // Adicionar animação de conclusão
    const taskElement = event.currentTarget
    if (!taskToUpdate.completed) {
        taskElement.classList.add('task-complete-animation')
        setTimeout(() => {
            taskElement.classList.remove('task-complete-animation')
        }, 600)
    }

    tasks[dateKey] = dayTasks.map(task => {
        if (task.id === taskId) {
            const updatedTask = { ...task, completed: !task.completed }

            // Atualizar estatísticas
            if (updatedTask.completed && !task.completed) {
                stats.totalPoints += task.points
                stats.totalTasks += 1
            } else if (!updatedTask.completed && task.completed) {
                stats.totalPoints = Math.max(0, stats.totalPoints - task.points)
                stats.totalTasks = Math.max(0, stats.totalTasks - 1)
            }

            return updatedTask
        }
        return task
    })
    saveState()
    renderTasks()
    checkNewBadges()
}

const deleteTask = (taskId, event) => {
    event.stopPropagation()
    const dateKey = formatDateKey(currentDate)
    const dayTasks = tasks[dateKey] || []

    const taskToDelete = dayTasks.find(task => task.id === taskId)
    if (!taskToDelete) return

    // Se a tarefa estava completa, remover pontos das estatísticas
    if (taskToDelete.completed) {
        stats.totalPoints = Math.max(0, stats.totalPoints - taskToDelete.points)
        stats.totalTasks = Math.max(0, stats.totalTasks - 1)
    }

    tasks[dateKey] = dayTasks.filter(task => task.id !== taskId)
    saveState()
    renderTasks()
    checkNewBadges()
}

// Lógica de Navegação de Dias
const navigateDay = (direction) => {
    currentDate.setDate(currentDate.getDate() + direction)
    updateHeaderDate()
    renderTasks()
}

// Lógica de Gamificação
const calculateStreak = () => {
    let streak = 0
    let tempDate = new Date()
    while (true) {
        const dateKey = formatDateKey(tempDate)
        const dayTasks = tasks[dateKey] || []
        const completedTasks = dayTasks.filter(task => task.completed).length

        if (completedTasks > 0) {
            streak++
            tempDate.setDate(tempDate.getDate() - 1)
        } else {
            break
        }
    }
    stats.streak = streak
    saveState()
    return streak
}

const checkNewBadges = () => {
    const currentStreak = calculateStreak()

    BADGES.forEach(badge => {
        let isEarned = false

        switch (badge.type) {
            case 'tasks':
                isEarned = stats.totalTasks >= badge.requirement
                break
            case 'points':
                isEarned = stats.totalPoints >= badge.requirement
                break
            case 'streak':
                isEarned = currentStreak >= badge.requirement
                break
        }

        // Se o badge foi desbloqueado agora, mostrar notificação
        if (isEarned && !stats.earnedBadges.includes(badge.id)) {
            showBadgeNotification(badge)
            stats.earnedBadges.push(badge.id)
        }
    })
    saveState()
    renderBadges()
}

const showBadgeNotification = (badge) => {
    const notification = document.createElement('div')
    notification.className = 'badge-notification'
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <div class="text-2xl"><i class="${badge.icon}"></i></div>
            <div>
                <div class="font-bold">Badge Desbloqueado!</div>
                <div class="text-sm">${badge.name}</div>
            </div>
        </div>
    `
    document.body.appendChild(notification)

    setTimeout(() => {
        notification.remove()
    }, 3000)
}

// Event Listeners
prevDayBtn.addEventListener('click', () => navigateDay(-1))
nextDayBtn.addEventListener('click', () => navigateDay(1))

addTaskBtn.addEventListener('click', () => {
    modal.classList.remove('hidden')
})

modalCloseBtn.addEventListener('click', () => {
    modal.classList.add('hidden')
})

createNewTaskBtn.addEventListener('click', addTask)

taskCategorySelect.addEventListener('change', (e) => {
    const selectedCategory = e.target.value
    taskPointsInput.value = TASK_CATEGORIES[selectedCategory].points
})

// Inicialização
const init = () => {
    loadState()
    updateHeaderDate()
    renderTasks()
    calculateStreak()
    checkNewBadges()
}

init()

