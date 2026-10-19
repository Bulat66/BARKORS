document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. ЛОГИКА СЛАЙДЕРА КАРТОЧЕК
    // ==========================================
    let slides = Array.from(document.querySelectorAll('.type-b .right-box .slide'));
    const container = document.querySelector('.type-b .right-box');
    const mainContainer = document.querySelector('.container');
    const AUTOPLAY_DELAY = 6000;
    let timerId = null;

    // Параметры слоев карточек
    const layers = [
        { top: '2rem', zIndex: 1, scale: 0.9, opacity: 0.7 },
        { top: '4rem', zIndex: 2, scale: 0.95, opacity: 0.85 },
        { top: '6rem', zIndex: 3, scale: 1, opacity: 1 }
    ];

    function renderSlides() {
        slides.forEach((slide, index) => {
            const layer = layers[index];
            slide.style.top = layer.top;
            slide.style.zIndex = layer.zIndex;
            slide.style.transform = `scale(${layer.scale})`;
            slide.style.opacity = layer.opacity;
        });
    }

    // ==========================================
    // 2. ИНИЦИАЛИЗАЦИЯ THREE.JS СЦЕНЫ
    // ==========================================
    const canvas = document.getElementById('three-canvas');
    const leftBox = document.querySelector('.left-box');

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        45, 
        leftBox.clientWidth / leftBox.clientHeight, 
        0.1, 
        1000
    );
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true 
    });
    renderer.setSize(leftBox.clientWidth, leftBox.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Настройка света (для объёма и золотистого блеска)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffe3a0, 2.0);
    mainLight.position.set(5, 6, 4);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // Группа под 3D-модели
    const packGroup = new THREE.Group();
    scene.add(packGroup);

    // ==========================================
    // 3. ЗАГРУЗКА GLB МОДЕЛЕЙ
    // ==========================================
    const loader = new THREE.GLTFLoader();
    let isLoaded = false; // Флаг готовности моделей

    const loadModel = (url) => new Promise((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
    });

    Promise.all([
        loadModel('3d/unit.glb'),
        loadModel('3d/unit_2.glb')
    ]).then(([gltf1, gltf2]) => {
        // Передняя пачка
        const modelFront = gltf1.scene;
        modelFront.scale.set(1, 1, 1); // Отрегулируйте масштаб под ваши модели при необходимости
        modelFront.position.set(-0.6, 0, 0.5);
        modelFront.rotation.set(0, 0.3, 0.1);

        // Задняя пачка
        const modelBack = gltf2.scene;
        modelBack.scale.set(0.9, 0.9, 0.9);
        modelBack.position.set(0.8, 0.2, -0.5);
        modelBack.rotation.set(0, -0.2, 0.05);

        packGroup.add(modelFront);
        packGroup.add(modelBack);

        isLoaded = true;
    }).catch(err => {
        console.error('Ошибка загрузки моделей:', err);
    });

    // ==========================================
    // 4. АНИМАЦИЯ И СИНХРОНИЗАЦИЯ
    // ==========================================
    let currentAngle = 0;

    function animate3DPack() {
        if (!isLoaded) return; // Защита от срабатывания до загрузки

        currentAngle += (Math.PI * 2) / 2; // Поворот сцены

        // Плавное вращение по оси Y
        gsap.to(packGroup.rotation, {
            y: currentAngle,
            duration: 1.2,
            ease: "power2.out"
        });

        // Легкое покачивание по оси Y для динамики
        gsap.to(packGroup.position, {
            y: 0.2,
            duration: 0.6,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut"
        });
    }

    function nextSlide() {
        // Сдвиг массива слайдов
        const topSlide = slides.pop();
        slides.unshift(topSlide);

        // Обновление DOM и 3D
        renderSlides();
        animate3DPack();
    }

    // Автопрокрутка
    function startAutoplay() {
        stopAutoplay();
        timerId = setInterval(nextSlide, AUTOPLAY_DELAY);
    }

    function stopAutoplay() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    }

    // События интерфейса
    container.addEventListener('click', () => {
        nextSlide();
        startAutoplay();
    });

    mainContainer.addEventListener('mouseenter', stopAutoplay);
    mainContainer.addEventListener('mouseleave', startAutoplay);

    // Главный цикл рендеринга Three.js (60 FPS)
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    // Запуск
    renderSlides();
    startAutoplay();
    animate();

    // Ресайз
    window.addEventListener('resize', () => {
        camera.aspect = leftBox.clientWidth / leftBox.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(leftBox.clientWidth, leftBox.clientHeight);
    });
});
