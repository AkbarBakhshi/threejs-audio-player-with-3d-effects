import * as THREE from 'three'
import gsap from 'gsap'

import vertex from 'shaders/vertex.glsl'
import fragment from 'shaders/fragment.glsl'

// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import LocomotiveScroll from 'locomotive-scroll';
import { ScrollTrigger } from 'gsap/ScrollTrigger'
gsap.registerPlugin(ScrollTrigger)

export default class {
    constructor() {
        this.isSoundOn = false

        this.clock = new THREE.Clock()

        this.threejsCanvas = document.querySelector('.threejs__canvas__container')
        this.width = this.threejsCanvas.offsetWidth
        this.height = this.threejsCanvas.offsetHeight

        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000)
        this.camera.position.set(0, 0, 50)

        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        })

        this.renderer.setSize(this.width, this.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        this.threejsCanvas.appendChild(this.renderer.domElement)

        this.soundButton = document.querySelector('.Threejs__intro__sound')

        this.soundButton.addEventListener('click', () => {
            if(this.isSoundOn) {
                this.sound.stop()
                this.soundButton.innerHTML = "Click to turn Sound On"
            } else {
                this.sound.play()
                this.soundButton.innerHTML = "Click to turn Sound Off"
            }

            this.isSoundOn = !this.isSoundOn
        })


        this.raycaster = new THREE.Raycaster()

        this.mouse = new THREE.Vector2()

        ////******SWITCH BETWEEN PARTICLES AND PLANET */
        this.createPlanet()
        // this.createStars()

        this.setupSound()

        this.locoScroll = new LocomotiveScroll({
            el: document.querySelector('.threejs'),
            smooth: true,
            smartphone: {
                smooth: true
            },
            tablet: {
                smooth: true
            }
        });
        this.setupScrollAnimation()
    }

    createPlanet() {

        this.planetGeometry = new THREE.SphereBufferGeometry(1, 50, 50)
        // console.log(geometry)

        const count = this.planetGeometry.attributes.position.count //number of vertices in the geometry
        const randoms = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            randoms[i] = Math.random()
        }
        // console.log(randoms)

        this.planetGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1))

        this.material = new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uHoverState: { value: 0 },
                uColor: { value: new THREE.Color(0x31c48D) },
                uColor1: { value: new THREE.Color(0x6C63FF) },
            }
        })

        this.object = new THREE.Mesh(this.planetGeometry, this.material)
        // this.object.position.y = 7

        this.scene.add(this.object)
    }

    createStars() {
        const numParticles = 100000
        const vertices = []
        const randomForParticles = new Float32Array(numParticles * 3)

        for (let i = 0; i < numParticles; i++) {

            const x = THREE.MathUtils.randFloatSpread(10)//random float between -5 and 5
            const y = THREE.MathUtils.randFloatSpread(10)
            const z = THREE.MathUtils.randFloatSpread(10)

            vertices.push(x, y, z)

            randomForParticles.set([
                Math.random() * 2 - 1,// zero to 2 minus 1
                Math.random() * 2 - 1,// zero to 2 minus 1
                Math.random() * 2 - 1// zero to 2 minus 1

            ], i * 3)

        }

        this.starsGeometry = new THREE.BufferGeometry()
        this.starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        this.starsGeometry.setAttribute('aRandom', new THREE.BufferAttribute(randomForParticles, 3))
        
        // this.starsMaterial = new THREE.PointsMaterial({ color: 0x31c48D, size: 0.02 })
        this.starsMaterial = new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uHoverState: { value: 0 },
                uColor: { value: new THREE.Color(0x31c48D) },
                uColor1: { value: new THREE.Color(0x6C63FF) },
            },
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        })
        
        this.starsMaterial.size = 1
        this.stars = new THREE.Points(this.starsGeometry, this.starsMaterial)

        this.scene.add(this.stars)
    }

    setupSound() {
        // create an AudioListener and add it to the camera
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        // create a global audio source
        this.sound = new THREE.PositionalAudio(this.listener);

        // load a sound and set it as the Audio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('sounds/sound.mp3', function (buffer) {
            this.sound.setBuffer(buffer);
            this.sound.setLoop( true );
            this.sound.setVolume( 1 );
            this.sound.setRefDistance( 1 );
        }.bind(this));
    
         ////******SWITCH BETWEEN PARTICLES AND PLANET */
        // this.stars.add(this.sound)
        this.object.add(this.sound)

        this.analyser = new THREE.AudioAnalyser( this.sound, 2048 )
    
    }

    locoUpdate() {
        try {
            // console.log('about scroll loco update')
            this.locoScroll.update()
        } catch {
            // console.log('error on about loco resize caught')
        }
    }

    setupScrollAnimation() {

        this.locoScroll.on("scroll", () => {
            try {
                ScrollTrigger.update();
                // console.log("about scroll trigger updated")
            } catch {
                // console.log("error on about scroll trigger resize caught")
            }
        });

        ScrollTrigger.scrollerProxy('.threejs', {
            scrollTop: (value) => {
                return arguments.length ? this.locoScroll.scrollTo(value, 0, 0) : this.locoScroll.scroll.instance.scroll.y;
            }, // we don't have to define a scrollLeft because we're only scrolling vertically.
            getBoundingClientRect() {
                return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
            },
            // LocomotiveScroll handles things completely differently on mobile devices - it doesn't even transform the container at all! So to get the correct behavior and avoid jitters, we should pin things with position: fixed on mobile. We sense it by checking to see if there's a transform applied to the container (the LocomotiveScroll-controlled element).
            pinType: document.querySelector('.threejs').style.transform ? "transform" : "fixed"
        })

        ScrollTrigger.addEventListener("refresh", () => this.locoUpdate())

        gsap.timeline({
            scrollTrigger: {
                scroller: ".threejs",
                trigger: '.threejs__story',
                // markers: true,
                start: 'top top', // when the top of the trigger hits the bottom of the viewport
                end: "bottom bottom",
                scrub: 1,
                // onEnter: () => this.sound.play()
            }
        })
            .to(this.camera.position, { x: 0, y: 0, z: 5 })
            
            ///******REMOVE FOR PARTICLES */
            .to(this.object.rotation, { y: Math.PI })

    }

    onMouseDown() {
    }

    onMouseUp() {
    }

    onMouseMove() {
    }

    update() {

        ScrollTrigger.refresh()

        // console.log(this.analyser.getAverageFrequency())

        this.renderer.render(this.scene, this.camera)

        const elapsedTime = this.clock.getElapsedTime()

        ///******SWITCH BETWEEN PARTICLES AND PLANET */
        this.material.uniforms.uTime.value = elapsedTime
        this.material.uniforms.uHoverState.value = this.analyser.getAverageFrequency() / 128
        
        // this.starsMaterial.uniforms.uHoverState.value = this.analyser.getAverageFrequency() / 32
        // this.starsMaterial.uniforms.uTime.value = elapsedTime
    }


    onResize() {
        this.width = this.threejsCanvas.offsetWidth
        this.height = this.threejsCanvas.offsetHeight

        this.renderer.setSize(this.width, this.height)
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        this.camera.aspect = this.width / this.height
        this.camera.updateProjectionMatrix()

    }

    /**
     * Destroy.
     */
    destroy() {
        $('.c-scrollbar').remove()
        this.locoScroll.destroy()
        this.locoScroll.stop()
        this.destroyThreejs(this.scene)
    }

    destroyThreejs(obj) {
        while (obj.children.length > 0) {
            this.destroyThreejs(obj.children[0]);
            obj.remove(obj.children[0]);
        }
        if (obj.geometry) obj.geometry.dispose();

        if (obj.material) {
            //in case of map, bumpMap, normalMap, envMap ...
            Object.keys(obj.material).forEach(prop => {
                if (!obj.material[prop])
                    return;
                if (obj.material[prop] !== null && typeof obj.material[prop].dispose === 'function')
                    obj.material[prop].dispose();
            })
            // obj.material.dispose();
        }
    }
}