import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  Flame, 
  Star, 
  Medal, 
  Crown,
  Clock,
  CheckCircle,
  BarChart3,
  Droplets,
  BookOpen,
  Dumbbell,
  Briefcase,
  Zap,
  Trash2,
  Edit3
} from 'lucide-react'
import './App.css'

// Categorias de tarefas com ícones e pontos
const TASK_CATEGORIES = {
  water: { icon: Droplets, label: 'Beber Água', points: 10, color: '#00ccff' },
  study: { icon: BookOpen, label: 'Estudar', points: 30, color: '#00ccff' },
  exercise: { icon: Dumbbell, label: 'Treinar', points: 25, color: '#00ccff' },
  work: { icon: Briefcase, label: 'Trabalho', points: 20, color: '#00ccff' },
  other: { icon: Zap, label: 'Outro', points: 10, color: '#00ccff' }
}

// Badges disponíveis
const BADGES = [
  { id: 'first_task', icon: Trophy, name: 'Primeira Tarefa', description: 'Complete sua primeira tarefa', requirement: 1, type: 'tasks' },
  { id: 'week_warrior', icon: Flame, name: 'Guerreiro da Semana', description: '7 dias consecutivos', requirement: 7, type: 'streak' },
  { id: 'task_master', icon: Star, name: 'Mestre das Tarefas', description: '50 tarefas completadas', requirement: 50, type: 'tasks' },
  { id: 'hundred_club', icon: Medal, name: 'Clube dos 100', description: '100 tarefas completadas', requirement: 100, type: 'tasks' },
  { id: 'point_king', icon: Crown, name: 'Rei dos Pontos', description: '500 pontos acumulados', requirement: 500, type: 'points' }
]

// Gerar horários de 6h às 23h
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 6; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
  }
  return slots
}

function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    category: 'other',
    time: '09:00',
    points: 10
  })
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalTasks: 0,
    streak: 0,
    earnedBadges: []
  })

  // Carregar dados do localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('daily-tasks')
    const savedStats = localStorage.getItem('daily-stats')
    
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    }
    
    if (savedStats) {
      setStats(JSON.parse(savedStats))
    }
  }, [])

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem('daily-tasks', JSON.stringify(tasks))
    localStorage.setItem('daily-stats', JSON.stringify(stats))
  }, [tasks, stats])

  // Formatar data para chave
  const formatDateKey = (date) => {
    return date.toISOString().split('T')[0]
  }

  // Obter tarefas do dia atual
  const getCurrentDayTasks = () => {
    const dateKey = formatDateKey(currentDate)
    return tasks[dateKey] || []
  }

  // Adicionar nova tarefa
  const addTask = () => {
    const dateKey = formatDateKey(currentDate)
    const taskId = Date.now().toString()
    
    const task = {
      id: taskId,
      title: newTask.title,
      category: newTask.category,
      time: newTask.time,
      points: TASK_CATEGORIES[newTask.category].points,
      completed: false,
      createdAt: new Date().toISOString()
    }

    setTasks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), task]
    }))

    setNewTask({
      title: '',
      category: 'other',
      time: '09:00',
      points: 10
    })
    
    setIsDialogOpen(false)
  }

  // Marcar tarefa como completa
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
    
    setTasks(prev => {
      const updatedTasks = {
        ...prev,
        [dateKey]: dayTasks.map(task => {
          if (task.id === taskId) {
            const updatedTask = { ...task, completed: !task.completed }
            
            // Atualizar estatísticas
            if (updatedTask.completed && !task.completed) {
              setStats(prevStats => {
                const newStats = {
                  ...prevStats,
                  totalPoints: prevStats.totalPoints + task.points,
                  totalTasks: prevStats.totalTasks + 1
                }
                
                // Verificar se desbloqueou algum badge
                checkNewBadges(newStats)
                
                return newStats
              })
            } else if (!updatedTask.completed && task.completed) {
              setStats(prevStats => ({
                ...prevStats,
                totalPoints: Math.max(0, prevStats.totalPoints - task.points),
                totalTasks: Math.max(0, prevStats.totalTasks - 1)
              }))
            }
            
            return updatedTask
          }
          return task
        })
      }
      return updatedTasks
    })
  }

  // Verificar novos badges desbloqueados
  const checkNewBadges = (newStats) => {
    const currentStreak = calculateStreak()
    
    BADGES.forEach(badge => {
      let isEarned = false
      
      switch (badge.type) {
        case 'tasks':
          isEarned = newStats.totalTasks >= badge.requirement
          break
        case 'points':
          isEarned = newStats.totalPoints >= badge.requirement
          break
        case 'streak':
          isEarned = currentStreak >= badge.requirement
          break
      }
      
      // Se o badge foi desbloqueado agora, mostrar notificação
      if (isEarned && !stats.earnedBadges.includes(badge.id)) {
        showBadgeNotification(badge)
        setStats(prev => ({
          ...prev,
          earnedBadges: [...prev.earnedBadges, badge.id]
        }))
      }
    })
  }

  // Mostrar notificação de badge desbloqueado
  const showBadgeNotification = (badge) => {
    // Criar elemento de notificação
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-primary to-blue-500 text-white p-4 rounded-lg shadow-lg z-50 badge-unlock'
    notification.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="text-2xl">${badge.icon.name === 'Trophy' ? '🏆' : badge.icon.name === 'Flame' ? '🔥' : badge.icon.name === 'Star' ? '⭐' : badge.icon.name === 'Medal' ? '🎖️' : '👑'}</div>
        <div>
          <div class="font-bold">Badge Desbloqueado!</div>
          <div class="text-sm">${badge.name}</div>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Remover após 3 segundos
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  // Deletar tarefa
  const deleteTask = (taskId, event) => {
    event.stopPropagation()
    const dateKey = formatDateKey(currentDate)
    const dayTasks = tasks[dateKey] || []
    
    const taskToDelete = dayTasks.find(task => task.id === taskId)
    if (!taskToDelete) return
    
    // Se a tarefa estava completa, remover pontos das estatísticas
    if (taskToDelete.completed) {
      setStats(prevStats => ({
        ...prevStats,
        totalPoints: Math.max(0, prevStats.totalPoints - taskToDelete.points),
        totalTasks: Math.max(0, prevStats.totalTasks - 1)
      }))
    }
    
    setTasks(prev => ({
      ...prev,
      [dateKey]: dayTasks.filter(task => task.id !== taskId)
    }))
  }

  // Navegar entre dias
  const navigateDay = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + direction)
    setCurrentDate(newDate)
  }

  // Calcular sequência de dias consecutivos
  const calculateStreak = () => {
    const today = new Date()
    let streak = 0
    let currentDate = new Date(today)
    
    // Verificar dias consecutivos para trás
    while (true) {
      const dateKey = formatDateKey(currentDate)
      const dayTasks = tasks[dateKey] || []
      const completedTasks = dayTasks.filter(task => task.completed)
      
      if (completedTasks.length > 0) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
      
      // Limitar a 30 dias para performance
      if (streak >= 30) break
    }
    
    return streak
  }

  // Verificar badges conquistados
  const checkEarnedBadges = () => {
    const currentStreak = calculateStreak()
    
    return BADGES.map(badge => {
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
      
      // Verificar se o badge já foi conquistado
      const alreadyEarned = stats.earnedBadges.includes(badge.id)
      
      return { ...badge, earned: isEarned || alreadyEarned }
    })
  }

  // Atualizar sequência quando as tarefas mudarem
  useEffect(() => {
    const newStreak = calculateStreak()
    if (newStreak !== stats.streak) {
      setStats(prev => ({ ...prev, streak: newStreak }))
    }
  }, [tasks])

  // Obter tarefas do dia atual
  const dayTasks = getCurrentDayTasks()
  const completedTasks = dayTasks.filter(task => task.completed)
  const todayPoints = completedTasks.reduce((sum, task) => sum + task.points, 0)
  const earnedBadges = checkEarnedBadges()

  // Formatar data para exibição
  const formatDisplayDate = (date) => {
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return 'Hoje'
    }
    
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen gradient-bg font-space-grotesk text-white particle-bg relative">
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="text-5xl font-bold gradient-text mb-2 floating">Minhas Tarefas</h1>
          <p className="text-muted-foreground text-lg animate-pulse-slow">Organize seu dia e conquiste seus objetivos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-morphism hover:neon-border transition-all duration-300 animate-bounce-in">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-primary animate-pulse" />
                <div>
                  <p className="text-sm text-muted-foreground">Pontos Hoje</p>
                  <p className="text-2xl font-bold text-primary animate-glow">{todayPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism hover:neon-border transition-all duration-300 animate-bounce-in" style={{animationDelay: '0.1s'}}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary animate-pulse" />
                <div>
                  <p className="text-sm text-muted-foreground">Completadas</p>
                  <p className="text-2xl font-bold text-primary">{completedTasks.length}/{dayTasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism hover:neon-border transition-all duration-300 animate-bounce-in" style={{animationDelay: '0.2s'}}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                <div>
                  <p className="text-sm text-muted-foreground">Sequência</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.streak} dias</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism hover:neon-border transition-all duration-300 animate-bounce-in" style={{animationDelay: '0.3s'}}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Trophy className="h-5 w-5 text-yellow-500 animate-pulse" />
                <div>
                  <p className="text-sm text-muted-foreground">Badges</p>
                  <p className="text-2xl font-bold text-yellow-500">{earnedBadges.filter(b => b.earned).length}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline Principal */}
          <div className="lg:col-span-2">
            <Card className="glass-morphism neon-border animate-slide-up">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateDay(-1)}
                    className="text-primary hover:bg-primary/20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-center">
                    <CardTitle className="text-xl">
                      {formatDisplayDate(currentDate)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDisplayDate(currentDate)}
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigateDay(1)}
                    className="text-primary hover:bg-primary/20"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {dayTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground mb-2">Nenhuma tarefa para este dia</p>
                    <p className="text-sm text-muted-foreground">Clique no + para adicionar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayTasks
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((task) => {
                        const CategoryIcon = TASK_CATEGORIES[task.category].icon
                        return (
                          <div
                            key={task.id}
                            className={`task-card p-4 rounded-lg cursor-pointer transition-all ${
                              task.completed ? 'opacity-75 bg-primary/10' : ''
                            }`}
                            onClick={(e) => toggleTask(task.id, e)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${task.completed ? 'bg-primary' : 'bg-muted'}`}>
                                <CategoryIcon className="h-4 w-4" />
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h3 className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                    {task.title}
                                  </h3>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={task.completed ? 'default' : 'secondary'}>
                                      {task.points} pts
                                    </Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                                      onClick={(e) => deleteTask(task.id, e)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-sm text-muted-foreground">{task.time}</span>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">
                                    {TASK_CATEGORIES[task.category].label}
                                  </span>
                                </div>
                              </div>
                              
                              {task.completed && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
                
                {/* Botão Adicionar Tarefa */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full mt-4 animate-glow hover:animate-pulse bg-gradient-to-r from-primary to-blue-500 hover:from-blue-500 hover:to-primary transition-all duration-300" size="lg">
                      <Plus className="h-4 w-4 mr-2 animate-spin" />
                      Adicionar Tarefa
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="glass-morphism neon-border animate-bounce-in">
                    <DialogHeader>
                      <DialogTitle className="text-primary">Nova Tarefa</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="title">Título da Tarefa</Label>
                        <Input
                          id="title"
                          placeholder="Ex: Beber 2L de água"
                          value={newTask.title}
                          onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="category">Categoria</Label>
                        <Select
                          value={newTask.category}
                          onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(TASK_CATEGORIES).map(([key, category]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center space-x-2">
                                  <category.icon className="h-4 w-4" />
                                  <span>{category.label} ({category.points} pts)</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="time">Horário</Label>
                        <Select
                          value={newTask.time}
                          onValueChange={(value) => setNewTask(prev => ({ ...prev, time: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {generateTimeSlots().map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground mb-2">Pontos</p>
                        <div className="text-2xl font-bold text-primary">
                          {TASK_CATEGORIES[newTask.category].points}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={addTask} 
                        className="w-full animate-glow bg-gradient-to-r from-primary to-blue-500 hover:from-blue-500 hover:to-primary transition-all duration-300"
                        disabled={!newTask.title.trim()}
                      >
                        Criar Tarefa
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar com Estatísticas e Badges */}
          <div className="space-y-6">
            {/* Estatísticas */}
            <Card className="glass-morphism neon-border animate-slide-up" style={{animationDelay: '0.2s'}}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span>Estatísticas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Últimos 7 dias</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.totalPoints}</div>
                      <div className="text-xs text-muted-foreground">Total de pontos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{stats.totalTasks}</div>
                      <div className="text-xs text-muted-foreground">Tarefas concluídas</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Histórico Diário</h4>
                    <div className="space-y-2">
                      {(() => {
                        const last7Days = []
                        for (let i = 6; i >= 0; i--) {
                          const date = new Date()
                          date.setDate(date.getDate() - i)
                          const dateKey = formatDateKey(date)
                          const dayTasks = tasks[dateKey] || []
                          const completedTasks = dayTasks.filter(task => task.completed)
                          const dayPoints = completedTasks.reduce((sum, task) => sum + task.points, 0)
                          
                          last7Days.push({
                            date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
                            points: dayPoints,
                            completed: completedTasks.length,
                            total: dayTasks.length
                          })
                        }
                        
                        return last7Days.map((day, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">{day.date}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-primary">{day.points}pts</span>
                              <span className="text-muted-foreground">({day.completed}/{day.total})</span>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Badges */}
            <Card className="glass-morphism neon-border animate-slide-up" style={{animationDelay: '0.4s'}}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>Conquistas</span>
                  </div>
                  <Badge variant="secondary">
                    {earnedBadges.filter(b => b.earned).length}/5
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {earnedBadges.map((badge) => {
                    const BadgeIcon = badge.icon
                    return (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-lg border ${
                          badge.earned 
                            ? 'badge-earned border-primary' 
                            : 'badge-locked border-muted'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <BadgeIcon className="h-6 w-6" />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{badge.name}</h4>
                            <p className="text-xs opacity-75">{badge.description}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
