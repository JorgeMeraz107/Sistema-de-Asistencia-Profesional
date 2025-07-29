// Variables globales
let currentStudents = []
let currentAttendance = {}
let currentClassInfo = {}
let attendanceHistory = []
let allStudentsBySubject = {}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  loadAllData()
  updateDashboard()
  setCurrentDate()
  setupEventListeners()
})

function setupEventListeners() {
  // Enter para agregar estudiante
  document.getElementById("studentName").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addStudent()
    }
  })

  // Cambio de materia
  document.getElementById("subjectSelect").addEventListener("change", handleSubjectChange)
}

function setCurrentDate() {
  const today = new Date().toISOString().split("T")[0]
  document.getElementById("classDate").value = today
}

function loadAllData() {
  // Cargar historial de asistencias
  const savedHistory = localStorage.getItem("attendance_history")
  if (savedHistory) {
    attendanceHistory = JSON.parse(savedHistory)
  }

  // Cargar estudiantes por materia
  const savedStudents = localStorage.getItem("students_by_subject")
  if (savedStudents) {
    allStudentsBySubject = JSON.parse(savedStudents)
  }

  updatePreviousSubjects()
}

function saveAllData() {
  localStorage.setItem("attendance_history", JSON.stringify(attendanceHistory))
  localStorage.setItem("students_by_subject", JSON.stringify(allStudentsBySubject))
}

function showMessage(text, type) {
  const container = document.getElementById("message")
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.textContent = text

  container.appendChild(messageDiv)

  setTimeout(() => {
    messageDiv.remove()
  }, 4000)
}

function showSection(sectionId) {
  // Ocultar todas las secciones
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active")
  })

  // Actualizar botones de navegación
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Mostrar sección seleccionada
  document.getElementById(sectionId).classList.add("active")

  // Activar botón correspondiente
  const btnMap = {
    dashboard: "dashboardBtn",
    newAttendance: "newBtn",
    history: "historyBtn",
  }

  if (btnMap[sectionId]) {
    document.getElementById(btnMap[sectionId]).classList.add("active")
  }

  // Acciones específicas por sección
  if (sectionId === "dashboard") {
    updateDashboard()
  } else if (sectionId === "history") {
    updateHistory()
  }
}

function updateDashboard() {
  // Estadísticas generales
  document.getElementById("totalAttendances").textContent = attendanceHistory.length
  document.getElementById("activeSubjects").textContent = Object.keys(allStudentsBySubject).length

  const totalStudents = Object.values(allStudentsBySubject).reduce((sum, students) => sum + students.length, 0)
  document.getElementById("totalStudents").textContent = totalStudents

  // Asistencias recientes
  const recentContainer = document.getElementById("recentAttendances")
  const recent = attendanceHistory.slice(-5).reverse()

  if (recent.length === 0) {
    recentContainer.innerHTML =
      '<p class="text-center" style="color: var(--text-secondary);">No hay asistencias registradas</p>'
    return
  }

  recentContainer.innerHTML = recent
    .map((attendance) => {
      const presentCount = Object.values(attendance.attendance).filter((status) => status === "present").length
      const totalCount = Object.keys(attendance.attendance).length

      return `
        <div class="recent-item" onclick="viewAttendanceDetails('${attendance.id}')">
          <div class="recent-info">
            <h4>${attendance.subject}</h4>
            <p>${attendance.teacher} • ${attendance.className} • ${attendance.date}</p>
          </div>
          <div class="recent-stats">
            <div style="color: var(--success-color);">${presentCount}/${totalCount} presentes</div>
            <div style="color: var(--text-secondary);">${attendance.time}</div>
          </div>
        </div>
      `
    })
    .join("")
}

function handleSubjectChange() {
  const select = document.getElementById("subjectSelect")
  const customInput = document.getElementById("customSubject")

  if (select.value === "custom") {
    customInput.classList.remove("hidden")
    customInput.focus()
  } else {
    customInput.classList.add("hidden")
  }

  validateForm()
}

function getSelectedSubject() {
  const select = document.getElementById("subjectSelect")
  if (select.value === "custom") {
    return document.getElementById("customSubject").value.trim()
  }
  return select.value
}

function validateForm() {
  const subject = getSelectedSubject()
  const teacher = document.getElementById("teacherName").value.trim()
  const className = document.getElementById("className").value.trim()
  const date = document.getElementById("classDate").value

  const isValid = subject && teacher && className && date && currentStudents.length > 0

  document.getElementById("startAttendanceBtn").disabled = !isValid
  return isValid
}

function showInputTab(tabName) {
  // Ocultar todas las pestañas
  document.querySelectorAll(".input-tab").forEach((tab) => {
    tab.classList.remove("active")
  })
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active")
  })

  // Mostrar pestaña seleccionada
  document.getElementById(tabName + "Tab").classList.add("active")
  event.target.classList.add("active")
}

function importStudents() {
  const text = document.getElementById("studentsList").value.trim()

  if (!text) {
    showMessage("❌ Pega la lista de estudiantes", "error")
    return
  }

  const names = text
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name.length > 0)

  if (names.length === 0) {
    showMessage("❌ No hay nombres válidos", "error")
    return
  }

  currentStudents = names.map((name, index) => ({
    id: index + 1,
    name: name,
  }))

  currentAttendance = {}
  updateCurrentStudentsDisplay()
  document.getElementById("studentsList").value = ""
  showMessage(`✅ ${names.length} estudiantes importados`, "success")
  validateForm()
}

function addStudent() {
  const name = document.getElementById("studentName").value.trim()

  if (!name) {
    showMessage("❌ Escribe el nombre del estudiante", "error")
    return
  }

  if (currentStudents.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    showMessage("❌ Este estudiante ya existe", "error")
    return
  }

  currentStudents.push({
    id: currentStudents.length + 1,
    name: name,
  })

  updateCurrentStudentsDisplay()
  document.getElementById("studentName").value = ""
  showMessage(`✅ ${name} agregado`, "success")
  validateForm()
}

function updatePreviousSubjects() {
  const select = document.getElementById("previousSubjectSelect")
  select.innerHTML = '<option value="">Selecciona materia anterior</option>'

  Object.keys(allStudentsBySubject).forEach((subject) => {
    select.innerHTML += `<option value="${subject}">${subject}</option>`
  })
}

function loadPreviousStudents() {
  const subject = document.getElementById("previousSubjectSelect").value
  if (!subject || !allStudentsBySubject[subject]) return

  const students = allStudentsBySubject[subject]
  document.getElementById("previousStudentsList").innerHTML = students
    .map((student) => `<div class="student-preview-item">${student.name}</div>`)
    .join("")
}

function usePreviousStudents() {
  const subject = document.getElementById("previousSubjectSelect").value
  if (!subject || !allStudentsBySubject[subject]) {
    showMessage("❌ Selecciona una materia", "error")
    return
  }

  currentStudents = [...allStudentsBySubject[subject]]
  currentAttendance = {}
  updateCurrentStudentsDisplay()
  showMessage(`✅ ${currentStudents.length} estudiantes cargados de ${subject}`, "success")
  validateForm()
}

function updateCurrentStudentsDisplay() {
  const container = document.getElementById("currentStudents")

  if (currentStudents.length === 0) {
    container.innerHTML = ""
    return
  }

  container.innerHTML = `
    <h4>👥 Estudiantes Actuales (${currentStudents.length})</h4>
    <div style="max-height: 200px; overflow-y: auto;">
      ${currentStudents
        .map(
          (student) => `
        <div class="student-preview-item">
          <span>${student.name}</span>
          <button onclick="removeCurrentStudent(${student.id})" class="remove-student-btn">🗑️</button>
        </div>
      `,
        )
        .join("")}
    </div>
  `
}

function removeCurrentStudent(id) {
  currentStudents = currentStudents.filter((s) => s.id !== id)
  delete currentAttendance[id]
  updateCurrentStudentsDisplay()
  validateForm()
}

function startAttendance() {
  if (!validateForm()) {
    showMessage("❌ Completa todos los campos", "error")
    return
  }

  // Guardar información de la clase
  currentClassInfo = {
    subject: getSelectedSubject(),
    teacher: document.getElementById("teacherName").value.trim(),
    className: document.getElementById("className").value.trim(),
    date: document.getElementById("classDate").value,
    time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
  }

  // Guardar estudiantes por materia para uso futuro
  allStudentsBySubject[currentClassInfo.subject] = [...currentStudents]
  saveAllData()

  // Mostrar sección de asistencia
  showSection("attendance")
  updateAttendanceDisplay()
}

function updateAttendanceDisplay() {
  // Información de la clase
  document.getElementById("attendanceInfo").innerHTML = `
    <h3>${currentClassInfo.subject}</h3>
    <p><strong>Profesor:</strong> ${currentClassInfo.teacher} | <strong>Grupo:</strong> ${currentClassInfo.className}</p>
    <p><strong>Fecha:</strong> ${currentClassInfo.date} | <strong>Hora:</strong> ${currentClassInfo.time}</p>
  `

  // Estadísticas
  const presentCount = Object.values(currentAttendance).filter((status) => status === "present").length
  const absentCount = Object.values(currentAttendance).filter((status) => status === "absent").length
  const totalCount = currentStudents.length

  document.getElementById("attendanceStats").innerHTML = `
    <div class="stat-card present">
      <div class="stat-number">${presentCount}</div>
      <div class="stat-label">Presentes</div>
    </div>
    <div class="stat-card absent">
      <div class="stat-number">${absentCount}</div>
      <div class="stat-label">Ausentes</div>
    </div>
    <div class="stat-card total">
      <div class="stat-number">${totalCount}</div>
      <div class="stat-label">Total</div>
    </div>
  `

  // Lista de estudiantes
  document.getElementById("attendanceList").innerHTML = currentStudents
    .map((student) => {
      const status = currentAttendance[student.id] || ""
      return `
      <div class="student-attendance-card ${status}">
        <div class="student-name">${student.name}</div>
        <div class="student-actions">
          <button class="attendance-btn present-btn" onclick="markPresent(${student.id})">
            ✅ Presente
          </button>
          <button class="attendance-btn absent-btn" onclick="markAbsent(${student.id})">
            ❌ Ausente
          </button>
        </div>
      </div>
    `
    })
    .join("")
}

function markPresent(id) {
  currentAttendance[id] = "present"
  updateAttendanceDisplay()
}

function markAbsent(id) {
  currentAttendance[id] = "absent"
  updateAttendanceDisplay()
}

function markAllPresent() {
  currentStudents.forEach((student) => {
    currentAttendance[student.id] = "present"
  })
  updateAttendanceDisplay()
  showMessage(`✅ Todos marcados como presentes (${currentStudents.length})`, "success")
}

function markAllAbsent() {
  currentStudents.forEach((student) => {
    currentAttendance[student.id] = "absent"
  })
  updateAttendanceDisplay()
  showMessage(`❌ Todos marcados como ausentes (${currentStudents.length})`, "success")
}

function resetCurrentAttendance() {
  if (confirm("¿Reiniciar toda la asistencia actual?")) {
    currentAttendance = {}
    updateAttendanceDisplay()
    showMessage("🔄 Asistencia reiniciada", "success")
  }
}

function saveAttendance() {
  const markedCount = Object.keys(currentAttendance).length
  const totalCount = currentStudents.length

  if (markedCount === 0) {
    showMessage("❌ No has marcado ninguna asistencia", "error")
    return
  }

  if (markedCount < totalCount) {
    const pending = totalCount - markedCount
    if (!confirm(`Tienes ${pending} estudiantes sin marcar. ¿Continuar?`)) {
      return
    }
  }

  // Crear registro de asistencia
  const attendanceRecord = {
    id: Date.now().toString(),
    ...currentClassInfo,
    attendance: { ...currentAttendance },
    students: [...currentStudents],
    timestamp: new Date().toISOString(),
  }

  // Guardar en historial
  attendanceHistory.push(attendanceRecord)
  saveAllData()

  // Mostrar modal de resultados
  showResultsModal(attendanceRecord)
  showMessage("✅ Asistencia guardada correctamente", "success")
}

function showResultsModal(record) {
  const presentStudents = record.students.filter((s) => record.attendance[s.id] === "present")
  const absentStudents = record.students.filter((s) => record.attendance[s.id] === "absent")
  const unmarkedStudents = record.students.filter((s) => !record.attendance[s.id])

  document.getElementById("modalResults").innerHTML = `
    <div style="text-align: center; margin-bottom: 1.5rem;">
      <h4>${record.subject}</h4>
      <p>${record.teacher} • ${record.className} • ${record.date}</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
      <div style="text-align: center; padding: 1rem; background: #dcfce7; border-radius: 0.5rem;">
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success-color);">${presentStudents.length}</div>
        <div>Presentes</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: #fef2f2; border-radius: 0.5rem;">
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--danger-color);">${absentStudents.length}</div>
        <div>Ausentes</div>
      </div>
      <div style="text-align: center; padding: 1rem; background: #fefce8; border-radius: 0.5rem;">
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--warning-color);">${unmarkedStudents.length}</div>
        <div>Sin marcar</div>
      </div>
    </div>
    
    ${
      presentStudents.length > 0
        ? `
      <div style="margin-bottom: 1rem;">
        <h5 style="color: var(--success-color); margin-bottom: 0.5rem;">✅ Presentes:</h5>
        <div style="max-height: 100px; overflow-y: auto; font-size: 0.875rem;">
          ${presentStudents.map((s) => s.name).join(", ")}
        </div>
      </div>
    `
        : ""
    }
    
    ${
      absentStudents.length > 0
        ? `
      <div style="margin-bottom: 1rem;">
        <h5 style="color: var(--danger-color); margin-bottom: 0.5rem;">❌ Ausentes:</h5>
        <div style="max-height: 100px; overflow-y: auto; font-size: 0.875rem;">
          ${absentStudents.map((s) => s.name).join(", ")}
        </div>
      </div>
    `
        : ""
    }
  `

  document.getElementById("resultsModal").style.display = "block"
}

function closeModal() {
  document.getElementById("resultsModal").style.display = "none"
}

function newAttendanceFromModal() {
  closeModal()

  // Limpiar datos actuales
  currentStudents = []
  currentAttendance = {}
  currentClassInfo = {}

  // Limpiar formulario
  document.getElementById("subjectSelect").value = ""
  document.getElementById("customSubject").value = ""
  document.getElementById("customSubject").classList.add("hidden")
  document.getElementById("teacherName").value = ""
  document.getElementById("className").value = ""
  document.getElementById("studentsList").value = ""
  document.getElementById("studentName").value = ""

  updateCurrentStudentsDisplay()
  setCurrentDate()
  showSection("newAttendance")
}

function updateHistory() {
  updateHistoryFilters()
  filterHistory()
}

function updateHistoryFilters() {
  const subjectFilter = document.getElementById("historySubjectFilter")
  const subjects = [...new Set(attendanceHistory.map((a) => a.subject))].sort()

  subjectFilter.innerHTML = '<option value="">Todas las materias</option>'
  subjects.forEach((subject) => {
    subjectFilter.innerHTML += `<option value="${subject}">${subject}</option>`
  })
}

function filterHistory() {
  const subjectFilter = document.getElementById("historySubjectFilter").value
  const monthFilter = document.getElementById("historyMonthFilter").value

  let filtered = [...attendanceHistory]

  if (subjectFilter) {
    filtered = filtered.filter((a) => a.subject === subjectFilter)
  }

  if (monthFilter) {
    const [year, month] = monthFilter.split("-")
    filtered = filtered.filter((a) => {
      const attendanceDate = new Date(a.date)
      return attendanceDate.getFullYear() == year && attendanceDate.getMonth() + 1 == month
    })
  }

  displayHistory(filtered.reverse())
}

function displayHistory(history) {
  const container = document.getElementById("historyList")

  if (history.length === 0) {
    container.innerHTML =
      '<p class="text-center" style="color: var(--text-secondary);">No hay asistencias que coincidan con los filtros</p>'
    return
  }

  container.innerHTML = history
    .map((record) => {
      const presentCount = Object.values(record.attendance).filter((status) => status === "present").length
      const absentCount = Object.values(record.attendance).filter((status) => status === "absent").length
      const totalCount = record.students.length

      return `
      <div class="history-item" onclick="viewAttendanceDetails('${record.id}')">
        <div class="history-header">
          <div>
            <div class="history-title">${record.subject}</div>
            <div class="history-meta">${record.teacher} • ${record.className} • ${record.date} ${record.time}</div>
          </div>
          <div class="history-stats">
            <span class="history-stat present">${presentCount} presentes</span>
            <span class="history-stat absent">${absentCount} ausentes</span>
            <span style="color: var(--text-secondary);">${totalCount} total</span>
          </div>
        </div>
      </div>
    `
    })
    .join("")
}

function viewAttendanceDetails(id) {
  const record = attendanceHistory.find((a) => a.id === id)
  if (!record) return

  // Cargar datos del registro para exportar
  currentClassInfo = { ...record }
  currentStudents = [...record.students]
  currentAttendance = { ...record.attendance }

  showResultsModal(record)
}

function exportWord() {
  if (!currentClassInfo.subject) {
    showMessage("❌ No hay datos para exportar", "error")
    return
  }

  const presentStudents = currentStudents.filter((s) => currentAttendance[s.id] === "present")
  const absentStudents = currentStudents.filter((s) => currentAttendance[s.id] === "absent")
  const unmarkedStudents = currentStudents.filter((s) => !currentAttendance[s.id])

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Lista de Asistencia</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 40px; 
            line-height: 1.6;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .info-table {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
        }
        .info-table td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .info-table .label {
            background: #f5f5f5;
            font-weight: bold;
            width: 150px;
        }
        .attendance-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
        }
        .attendance-table th, .attendance-table td { 
            border: 1px solid #333; 
            padding: 12px; 
            text-align: left; 
        }
        .attendance-table th { 
            background: #f0f0f0; 
            font-weight: bold;
        }
        .present { background: #d4edda; }
        .absent { background: #f8d7da; }
        .unmarked { background: #fff3cd; }
        .summary {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .summary-table {
            width: 300px;
            border-collapse: collapse;
            margin: 0 auto;
        }
        .summary-table td {
            padding: 10px;
            border: 1px solid #ddd;
            text-align: center;
            font-weight: bold;
        }
        .signature {
            margin-top: 50px;
            text-align: right;
        }
        .signature-line {
            border-bottom: 1px solid #333;
            width: 300px;
            margin: 20px 0 5px auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 LISTA DE ASISTENCIA</h1>
        <h2>${currentClassInfo.subject}</h2>
    </div>

    <table class="info-table">
        <tr>
            <td class="label">Profesor/a:</td>
            <td>${currentClassInfo.teacher}</td>
            <td class="label">Grupo/Clase:</td>
            <td>${currentClassInfo.className}</td>
        </tr>
        <tr>
            <td class="label">Fecha:</td>
            <td>${currentClassInfo.date}</td>
            <td class="label">Hora:</td>
            <td>${currentClassInfo.time}</td>
        </tr>
    </table>

    <table class="attendance-table">
        <thead>
            <tr>
                <th style="width: 50px;">#</th>
                <th>Nombre del Estudiante</th>
                <th style="width: 100px;">Estado</th>
                <th style="width: 150px;">Observaciones</th>
            </tr>
        </thead>
        <tbody>
            ${currentStudents
              .map((student, index) => {
                const status = currentAttendance[student.id] || "unmarked"
                const statusText = status === "present" ? "PRESENTE" : status === "absent" ? "AUSENTE" : "SIN MARCAR"
                return `
                <tr class="${status}">
                    <td>${index + 1}</td>
                    <td>${student.name}</td>
                    <td><strong>${statusText}</strong></td>
                    <td></td>
                </tr>
            `
              })
              .join("")}
        </tbody>
    </table>

    <div class="summary">
        <h3 style="text-align: center;">RESUMEN DE ASISTENCIA</h3>
        <table class="summary-table">
            <tr>
                <td style="background: #d4edda;">Presentes</td>
                <td>${presentStudents.length}</td>
            </tr>
            <tr>
                <td style="background: #f8d7da;">Ausentes</td>
                <td>${absentStudents.length}</td>
            </tr>
            <tr>
                <td style="background: #fff3cd;">Sin marcar</td>
                <td>${unmarkedStudents.length}</td>
            </tr>
            <tr>
                <td style="background: #e9ecef;"><strong>TOTAL</strong></td>
                <td><strong>${currentStudents.length}</strong></td>
            </tr>
        </table>
    </div>

    <div class="signature">
        <p>Firma del Profesor/a:</p>
        <div class="signature-line"></div>
        <p>${currentClassInfo.teacher}</p>
    </div>
</body>
</html>
  `

  const blob = new Blob([html], { type: "text/html;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = `Lista_${currentClassInfo.subject}_${currentClassInfo.date}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showMessage("✅ Archivo para Word descargado", "success")
}

function exportExcel() {
  if (!currentClassInfo.subject) {
    showMessage("❌ No hay datos para exportar", "error")
    return
  }

  let csv = `Lista de Asistencia - ${currentClassInfo.subject}\n`
  csv += `Profesor/a: ${currentClassInfo.teacher}\n`
  csv += `Grupo: ${currentClassInfo.className}\n`
  csv += `Fecha: ${currentClassInfo.date}\n`
  csv += `Hora: ${currentClassInfo.time}\n\n`
  csv += "#,Nombre,Estado,Observaciones\n"

  currentStudents.forEach((student, index) => {
    const status = currentAttendance[student.id] || "Sin marcar"
    const statusText = status === "present" ? "PRESENTE" : status === "absent" ? "AUSENTE" : "SIN MARCAR"
    csv += `${index + 1},"${student.name}","${statusText}",\n`
  })

  csv += `\nRESUMEN:\n`
  csv += `Presentes,${Object.values(currentAttendance).filter((s) => s === "present").length}\n`
  csv += `Ausentes,${Object.values(currentAttendance).filter((s) => s === "absent").length}\n`
  csv += `Sin marcar,${currentStudents.length - Object.keys(currentAttendance).length}\n`
  csv += `TOTAL,${currentStudents.length}\n`

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = `Lista_${currentClassInfo.subject}_${currentClassInfo.date}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  showMessage("✅ Archivo Excel descargado", "success")
}
