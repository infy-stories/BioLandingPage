const canvas = document.getElementById('adminMascotCanvas');
const stage = document.getElementById('adminMascotWrap');
let THREE;

try {
    THREE = await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
} catch (error) {
    stage?.classList.add('admin-mascot-unavailable');
    console.warn('Admin mascot module could not load.', error);
}

if (THREE && canvas && stage) {
    try {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 2, 0.1, 30);
        camera.position.set(0, 0.18, 5.2);
        camera.lookAt(0, 0.08, 0);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;

        scene.add(new THREE.HemisphereLight(0xfff5e8, 0x39464b, 2.2));
        const keyLight = new THREE.DirectionalLight(0xffdfc1, 3.2);
        keyLight.position.set(-3, 4, 5);
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0x9bd5ce, 1.3);
        fillLight.position.set(3, 1, 2);
        scene.add(fillLight);

        const materials = {
            skin: new THREE.MeshStandardMaterial({ color: 0xd89578, roughness: 0.72 }),
            skinLight: new THREE.MeshStandardMaterial({ color: 0xf0b79b, roughness: 0.66 }),
            hair: new THREE.MeshStandardMaterial({ color: 0x30312e, roughness: 0.84 }),
            coat: new THREE.MeshStandardMaterial({ color: 0x34766e, roughness: 0.75 }),
            coatLight: new THREE.MeshStandardMaterial({ color: 0x58a193, roughness: 0.68 }),
            accent: new THREE.MeshStandardMaterial({ color: 0xf2753b, roughness: 0.56 }),
            eye: new THREE.MeshStandardMaterial({ color: 0xfffcf4, roughness: 0.34 }),
            iris: new THREE.MeshStandardMaterial({ color: 0x397d78, roughness: 0.38 }),
            pupil: new THREE.MeshStandardMaterial({ color: 0x252b2a, roughness: 0.28 }),
            mouth: new THREE.MeshStandardMaterial({ color: 0x5c302d, roughness: 0.7 }),
            shine: new THREE.MeshBasicMaterial({ color: 0xffffff }),
            shadow: new THREE.MeshBasicMaterial({ color: 0x24352f, transparent: true, opacity: 0.16 }),
        };

        const root = new THREE.Group();
        scene.add(root);

        const makeMesh = (geometry, material, parent, position, scale) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...position);
            if (scale) mesh.scale.set(...scale);
            parent.add(mesh);
            return mesh;
        };
        const sphere = (parent, material, position, scale) =>
            makeMesh(new THREE.SphereGeometry(1, 32, 24), material, parent, position, scale);
        const capsule = (parent, material, position, radius, length, scale = [1, 1, 1]) =>
            makeMesh(new THREE.CapsuleGeometry(radius, length, 5, 12), material, parent, position, scale);

        makeMesh(new THREE.CircleGeometry(0.82, 48), materials.shadow, root, [0, -1.26, 0], [1, 0.3, 1]).rotation.x = -Math.PI / 2;

        const body = new THREE.Group();
        root.add(body);
        capsule(body, materials.coat, [0, -0.76, 0], 0.43, 0.52, [1.32, 1, 0.85]);
        sphere(body, materials.coat, [-0.48, -0.55, 0], [0.35, 0.38, 0.37]);
        sphere(body, materials.coat, [0.48, -0.55, 0], [0.35, 0.38, 0.37]);
        capsule(body, materials.skin, [0, -0.16, 0.02], 0.17, 0.25, [1, 0.84, 0.9]);
        capsule(body, materials.accent, [0, -0.36, 0.37], 0.055, 0.3, [1.2, 1, 0.6]);
        capsule(body, materials.coatLight, [-0.61, -0.69, 0.04], 0.12, 0.42, [1, 1.05, 0.9]).rotation.z = -0.5;
        capsule(body, materials.coatLight, [0.61, -0.69, 0.04], 0.12, 0.42, [1, 1.05, 0.9]).rotation.z = 0.5;
        sphere(body, materials.skinLight, [-0.73, -0.38, 0.17], [0.15, 0.16, 0.14]);
        sphere(body, materials.skinLight, [0.73, -0.38, 0.17], [0.15, 0.16, 0.14]);
        sphere(body, materials.accent, [0, -0.69, 0.39], [0.07, 0.07, 0.045]);

        const headPivot = new THREE.Group();
        headPivot.position.set(0, 0.47, 0);
        root.add(headPivot);
        sphere(headPivot, materials.skin, [0, 0.24, 0], [0.64, 0.74, 0.52]);
        sphere(headPivot, materials.skin, [-0.61, 0.22, 0], [0.14, 0.2, 0.12]);
        sphere(headPivot, materials.skin, [0.61, 0.22, 0], [0.14, 0.2, 0.12]);
        sphere(headPivot, materials.skinLight, [-0.62, 0.23, 0.085], [0.055, 0.09, 0.045]);
        sphere(headPivot, materials.skinLight, [0.62, 0.23, 0.085], [0.055, 0.09, 0.045]);

        sphere(headPivot, materials.hair, [0, 0.75, -0.015], [0.67, 0.35, 0.54]);
        sphere(headPivot, materials.hair, [-0.38, 0.66, 0.31], [0.26, 0.24, 0.25]);
        sphere(headPivot, materials.hair, [-0.12, 0.79, 0.39], [0.27, 0.2, 0.2]);
        sphere(headPivot, materials.hair, [0.17, 0.73, 0.38], [0.29, 0.22, 0.2]);

        const eyes = [];
        const brows = [];
        [-1, 1].forEach(side => {
            const x = side * 0.235;
            sphere(headPivot, materials.eye, [x, 0.31, 0.435], [0.19, 0.155, 0.105]);
            const iris = sphere(headPivot, materials.iris, [x, 0.31, 0.526], [0.093, 0.104, 0.052]);
            const pupil = sphere(headPivot, materials.pupil, [x, 0.31, 0.568], [0.052, 0.067, 0.034]);
            sphere(headPivot, materials.shine, [x - 0.02, 0.35, 0.597], [0.022, 0.024, 0.012]);
            const lid = sphere(headPivot, materials.skin, [x, 0.42, 0.59], [0.205, 0.025, 0.075]);
            lid.renderOrder = 3;
            const brow = capsule(headPivot, materials.hair, [x, 0.525, 0.49], 0.035, 0.16, [1, 0.9, 1]);
            brow.rotation.z = Math.PI / 2;
            brows.push(brow);
            eyes.push({ side, x, iris, pupil, lid });
        });

        sphere(headPivot, materials.skinLight, [0, 0.18, 0.56], [0.075, 0.11, 0.09]);

        const makeCurveMouth = (middleY) => {
            const curve = new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(-0.15, 0.025, 0.515),
                new THREE.Vector3(0, middleY, 0.575),
                new THREE.Vector3(0.15, 0.025, 0.515),
            );
            return new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.018, 8, false), materials.mouth);
        };
        const smile = makeCurveMouth(-0.055);
        const frown = makeCurveMouth(0.095);
        const flatMouth = makeMesh(new THREE.CapsuleGeometry(0.018, 0.15, 4, 8), materials.mouth, headPivot, [0, 0.035, 0.54], [1, 1, 0.55]);
        flatMouth.rotation.z = Math.PI / 2;
        const surprised = sphere(headPivot, materials.mouth, [0, 0.035, 0.54], [0.065, 0.09, 0.035]);
        frown.visible = false;
        flatMouth.visible = false;
        surprised.visible = false;
        headPivot.add(smile, frown);

        const expressions = {
            idle: { lids: 0, tilt: 0, headX: 0, gazeX: 0, gazeY: 0, brows: [0, 0], mouth: 'smile', bob: 0 },
            typing: { lids: 1, tilt: -0.08, headX: -0.06, gazeX: 0, gazeY: -0.03, brows: [0.12, 0.12], mouth: 'flat', bob: 0 },
            peek: { lids: 0.56, tilt: 0.1, headX: 0.025, gazeX: 0.23, gazeY: 0, brows: [0.08, 0.08], mouth: 'smile', bob: 0 },
            thinking: { lids: 0.12, tilt: -0.04, headX: 0.04, gazeX: -0.08, gazeY: 0.15, brows: [0.1, 0.1], mouth: 'flat', bob: 0 },
            judgemental: { lids: 0.34, tilt: -0.13, headX: 0.01, gazeX: 0.38, gazeY: -0.03, brows: [-0.28, 0.1], mouth: 'frown', bob: 0 },
            confused: { lids: 0.02, tilt: 0.25, headX: 0, gazeX: -0.12, gazeY: 0.06, brows: [0.3, -0.18], mouth: 'surprised', bob: 0 },
            happy: { lids: 0, tilt: 0.02, headX: 0, gazeX: 0, gazeY: 0.03, brows: [0.12, 0.12], mouth: 'smile', bob: 1 },
        };
        let currentState = 'idle';
        let target = expressions.idle;
        let gazePointerX = 0;
        let gazePointerY = 0;
        let blinkStart = -1;
        let nextBlink = performance.now() + 1800;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function setExpression(state) {
            if (!expressions[state]) return;
            currentState = state;
            target = expressions[state];
            smile.visible = target.mouth === 'smile';
            frown.visible = target.mouth === 'frown';
            flatMouth.visible = target.mouth === 'flat';
            surprised.visible = target.mouth === 'surprised';
        }

        window.addEventListener('admin:mascot-state', event => setExpression(event.detail?.state));
        setExpression(window.adminMascotCurrentState || 'idle');

        stage.addEventListener('pointermove', event => {
            const bounds = stage.getBoundingClientRect();
            gazePointerX = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 0.7, -0.3, 0.3);
            gazePointerY = THREE.MathUtils.clamp((0.5 - (event.clientY - bounds.top) / bounds.height) * 0.3, -0.12, 0.12);
        });
        stage.addEventListener('pointerleave', () => {
            gazePointerX = 0;
            gazePointerY = 0;
        });

        const resize = () => {
            const bounds = stage.getBoundingClientRect();
            if (!bounds.width || !bounds.height) return;
            renderer.setSize(bounds.width, bounds.height, false);
            camera.aspect = bounds.width / bounds.height;
            camera.updateProjectionMatrix();
        };
        new ResizeObserver(resize).observe(stage);
        window.addEventListener('resize', resize);

        const smooth = (value, destination, amount) => THREE.MathUtils.lerp(value, destination, amount);
        const animate = now => {
            requestAnimationFrame(animate);
            if (!renderer.getSize(new THREE.Vector2()).x) resize();

            if (!reducedMotion && currentState === 'idle' && now > nextBlink) {
                blinkStart = now;
                nextBlink = now + 2400 + Math.random() * 2600;
            }
            let blink = 0;
            if (blinkStart >= 0) {
                const phase = (now - blinkStart) / 180;
                if (phase >= 1) blinkStart = -1;
                else blink = Math.sin(phase * Math.PI);
            }

            const motion = reducedMotion ? 1 : 0.095;
            const bob = reducedMotion ? 0 : Math.sin(now * 0.0018) * 0.025;
            root.position.y = smooth(root.position.y, -0.02 + bob + (target.bob ? Math.max(0, Math.sin(now * 0.012)) * 0.09 : 0), motion);
            headPivot.rotation.z = smooth(headPivot.rotation.z, target.tilt, motion);
            headPivot.rotation.x = smooth(headPivot.rotation.x, target.headX, motion);
            brows.forEach((brow, index) => {
                brow.rotation.z = smooth(brow.rotation.z, Math.PI / 2 + target.brows[index] * (index === 0 ? 1 : -1), motion);
            });

            const gazeX = target.gazeX + (currentState === 'idle' ? gazePointerX : 0);
            const gazeY = target.gazeY + (currentState === 'idle' ? gazePointerY : 0);
            eyes.forEach(eye => {
                eye.iris.position.x = eye.x + gazeX * 0.12;
                eye.pupil.position.x = eye.x + gazeX * 0.12;
                eye.iris.position.y = smooth(eye.iris.position.y, 0.31 + gazeY * 0.08, motion);
                eye.pupil.position.y = smooth(eye.pupil.position.y, 0.31 + gazeY * 0.08, motion);
                const lidAmount = Math.max(target.lids, blink);
                eye.lid.scale.y = smooth(eye.lid.scale.y, 0.025 + lidAmount * 0.14, motion);
                eye.lid.position.y = smooth(eye.lid.position.y, 0.43 - lidAmount * 0.09, motion);
            });

            renderer.render(scene, camera);
        };
        resize();
        requestAnimationFrame(animate);
    } catch (error) {
        stage.classList.add('admin-mascot-unavailable');
        console.warn('Admin mascot could not start.', error);
    }
}