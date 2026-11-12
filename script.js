import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, orderBy, query } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmWXSG5ns1SkisaOLUz0h2KOb3v8r2QlU",
  authDomain: "lista-de-pendientes-fn.firebaseapp.com",
  projectId: "lista-de-pendientes-fn",
  storageBucket: "lista-de-pendientes-fn.firebasestorage.app",
  messagingSenderId: "569842019189",
  appId: "1:569842019189:web:77c31743665ce31c46413c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ==========================================
   MENÚ FLOTANTE Y NAVEGACIÓN (Lectura vs Creación)
   ========================================== */
const fabButton = document.getElementById('fabButton');
const fabMenu = document.getElementById('fabMenu');
const navItems = document.querySelectorAll('.fab-menu li, .home-btn');
const panels = document.querySelectorAll('.app-container');
const watermark = document.getElementById('watermark');
const homeMenu = document.getElementById('homeMenu');

const closeBtns = document.querySelectorAll('.close-btn');

closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Oculta todos los paneles
        panels.forEach(panel => panel.classList.add('hidden'));
        
        // Vuelve a mostrar el inicio (marca de agua y menú central)
        if (watermark) watermark.classList.remove('hidden');
        if (homeMenu) homeMenu.classList.remove('hidden');
    });
});

if (fabButton) {
    fabButton.addEventListener('click', () => {
        fabMenu.classList.toggle('show');
        fabButton.classList.toggle('active');
    });
}

navItems.forEach(item => {
    item.addEventListener('click', function() {
        const selectedPanelId = this.getAttribute('data-target');
        panels.forEach(panel => panel.classList.add('hidden'));

        // Detectar si entró por el menú central (Lectura)
        const esModoLectura = this.classList.contains('home-btn');

        if (selectedPanelId === 'home') {
            if (watermark) watermark.classList.remove('hidden');
            if (homeMenu) homeMenu.classList.remove('hidden');
        } else {
            if (watermark) watermark.classList.add('hidden');
            if (homeMenu) homeMenu.classList.add('hidden');
            
            const panelAMostrar = document.getElementById(selectedPanelId);
            if (panelAMostrar) {
                panelAMostrar.classList.remove('hidden');
                
                // Ocultar o mostrar la barra de escritura
                const inputSection = panelAMostrar.querySelector('.input-section');
                if (inputSection) {
                    inputSection.style.display = esModoLectura ? 'none' : 'flex';
                }
            }
        }

        if (fabMenu) fabMenu.classList.remove('show');
        if (fabButton) fabButton.classList.remove('active');
    });
});

document.addEventListener('click', (event) => {
    if (!event.target.closest('.fab-container')) {
        if (fabMenu) fabMenu.classList.remove('show');
        if (fabButton) fabButton.classList.remove('active');
    }
});

/* ==========================================
   CONEXIÓN A FIREBASE Y SISTEMA DE "CHECK"
   ========================================== */
const btnGeneral = document.getElementById('btnGeneral');
const btnTourney = document.getElementById('btnTourney');
const btnTeam = document.getElementById('btnTeam');

if (btnGeneral) btnGeneral.addEventListener('click', () => addTask('tareas_general', 'inputGeneral'));
if (btnTourney) btnTourney.addEventListener('click', () => addTask('tareas_torneos', 'inputTourney'));
if (btnTeam) btnTeam.addEventListener('click', () => addTask('tareas_equipo', 'inputTeam'));

async function addTask(collectionName, inputId) {
    const inputElement = document.getElementById(inputId);
    const taskText = inputElement.value.trim();
    if (taskText === '') return;

    try {
        await addDoc(collection(db, collectionName), {
            texto: taskText,
            fecha: new Date()
        });
        inputElement.value = ''; 
    } catch (error) {
        console.error("Error al agregar tarea: ", error);
    }
}

function listenToTasks(collectionName, listId) {
    const listElement = document.getElementById(listId);
    if (!listElement) return;

    const q = query(collection(db, collectionName), orderBy("fecha", "asc"));

    onSnapshot(q, (snapshot) => {
        listElement.innerHTML = '';
        snapshot.forEach((documento) => {
            createTaskElement(documento.id, documento.data(), listElement, collectionName);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    listenToTasks('tareas_general', 'listGeneral');
    listenToTasks('tareas_torneos', 'listTourney');
    listenToTasks('tareas_equipo', 'listTeam');
});

// Crear el elemento visual con su Checkbox que elimina (SIN BOTÓN ROJO)
function createTaskElement(docId, taskData, listElement, collectionName) {
    const li = document.createElement('li');
    
    // Contenedor para la casilla y el texto
    const taskContent = document.createElement('div');
    taskContent.classList.add('task-content');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('task-check');
    
    const textSpan = document.createElement('span');
    // Soporte seguro para extraer el texto de la base de datos
    textSpan.textContent = typeof taskData === 'object' ? taskData.texto : taskData;

    // Al marcar el check, borra la tarea de Firebase
    checkbox.addEventListener('change', async () => {
        if (checkbox.checked) {
            try {
                await deleteDoc(doc(db, collectionName, docId));
            } catch (error) {
                console.error("Error al borrar tarea con el check: ", error);
            }
        }
    });

    // Unimos la casilla y el texto
    taskContent.appendChild(checkbox);
    taskContent.appendChild(textSpan);

    // Agregamos todo a la lista (ya sin el botón rojo)
    li.appendChild(taskContent);
    listElement.appendChild(li);
}