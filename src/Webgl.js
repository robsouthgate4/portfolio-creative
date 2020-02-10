
import PostProcessing from './postprocessing/PostProcessing';
import { TweenMax, SlowMo } from 'gsap';
import normalMap from './assets/images/normalMap.jpg';

import translucentPBR from './materials/translucentPBR';


import Utils from './utils';
import { Color, Vector2, Colors, Vector3, PerspectiveCamera, PlaneGeometry, BoxGeometry, Mesh, HemisphereLight, DirectionalLight } from 'three';


function importAll( r ) {

	console.log( r );
	return r.keys().map( r );

}

const images = importAll( require.context( './assets/images/cube', false, /\.(png|jpe?g|svg)$/ ) );


export default class Webgl {

	constructor( w, h ) {

		this.meshCount = 0;
		this.meshListeners = [];
		this.camera;
		this.renderer = new THREE.WebGLRenderer( {
			antialias: true,
			preserveDrawingBuffer: true,
			logarithmicDepthBuffer: true
		} );

		this.raycaster = new THREE.Raycaster();

	

		if ( ! this.renderer.extensions.get( 'WEBGL_depth_texture' ) ) {

			alert( 'No depth!' );

		}

        this.renderer.setPixelRatio( window.devicePixelRatio );
        
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        this.renderer.toneMappingExposure = 1.0;

		this.scene = new THREE.Scene();
		this.width = w;
		this.height = h;
		this.scene.background = new THREE.Color( 0x000000 );
		this.container = new THREE.Object3D();

		this.mobile = false;

		this.grid = {
			cols: 30,
			rows: 30
		};

		this.light2;

		this.dom = this.renderer.domElement;

		this.clock = new THREE.Clock();

		this.hexagonArray = [];
		this.object3D;
		this.container;
		this.update = this.update.bind( this );
		this.resize = this.resize.bind( this );

		this.mouse3D = new THREE.Vector2();



		window.addEventListener( 'mousemove', this.onMouseMove.bind( this ), { passive: true } );
		window.addEventListener( 'touchstart', this.onTouchStart.bind( this ), { passive: true } );
		window.addEventListener( 'resize', this.onResize.bind( this ) )

		this.onMouseMove( { clientX: 0, clientY: 0 } );

	}

	onMouseMove( { clientX, clientY } ) {

		this.mouse3D.x = ( clientX / this.width ) * 2 - 1;
		this.mouse3D.y = - ( clientY / this.height ) * 2 + 1;

	}

	onTouchStart( evt ) {

		this.mouse3D.x = ( evt.touches[0].clientX / this.width ) * 2 - 1;
		this.mouse3D.y = - ( evt.touches[0].clientY / this.height ) * 2 + 1;

	}

	createCamera() {

		this.camera = new PerspectiveCamera( 45, this.width / this.height, 1, 40 );

		this.camera.position.z = 26;
		this.camera.position.y = 0;
		this.camera.position.x = 0;

		this.cubeCamera = new THREE.CubeCamera( 1, 100000, 128 );
		this.scene.add( this.cubeCamera );
		this.cubeCamera.position.copy( this.camera );

	}

	initPostProcessing() {

		this.postProcessing = new PostProcessing( this.renderer, this.scene, this.camera, this.width, this.height );
		this.postProcessing.init();

	}

	init( geo ) {

		this.createCamera();
		this.initPlatform( geo );
		this.addFloor();
		this.setLights();
		//this.initPostProcessing();
		this.resize( window.innerWidth, window.innerHeight );

		if (window.innerWidth <= 600) {

			this.mobile = true;

		}


	}

	onResize() {

		this.resize( window.innerWidth, window.innerHeight );

	}

	initPlatform( geo ) {

		let hexagon;

		var loader = new THREE.CubeTextureLoader();
		console.log( loader );

		var textureCube = loader.load( images );

        const iceMaterial = translucentPBR;
 

		for ( let i = 0; i < this.grid.cols; i ++ ) {

			this.hexagonArray[ i ] = [];

			for ( let j = 0; j < this.grid.rows; j ++ ) {

				hexagon = this.createHexagonInstance( geo, textureCube );
				hexagon.position.y = ( i * 1.7 );
				hexagon.rotation.set( THREE.Math.degToRad( 90 ), 0, 0 );

				hexagon.scale.set( 0.85, 0.4, 0.85 );

				hexagon.position.x = ( j * 1.5 );
				hexagon.position.z = Math.random() * ( 1 - ( - 1 ) ) + ( - 1 );
				hexagon.position.z = 0;

				hexagon.initialRotation = {
					x: hexagon.rotation.x,
					y: hexagon.rotation.y,
					z: hexagon.rotation.z
				};

				if ( j % 2 == 0 ) {

					hexagon.position.y += 0.85;

				}

				hexagon.initialPosition = {
					x: hexagon.position.x,
					y: hexagon.position.y,
					z: hexagon.position.z
				};



				this.hexagonArray.push( hexagon );
				this.container.add( hexagon );
				this.hexagonArray[ i ][ j ] = hexagon;


			}

		}



		this.container.position.set( - 21, - 24, 0 );

		this.scene.add( this.container );

	}

	addFloor() {

		const geometry = new THREE.PlaneGeometry( 100, 100 );
		const material = new THREE.ShadowMaterial( { opacity: 0.3 } );
		this.floor = new THREE.Mesh( geometry, material );
		this.floor.position.z = 0;

		//this.scene.add( this.floor );

	}

	createHexagonInstance( geo, cubeTexture ) {

		const material = translucentPBR;

		material.needsUpdate = true;

		const hexagon = new THREE.Mesh( geo.children[ 0 ].geometry, material );
		// hexagon.castShadow = true;
		// hexagon.receiveShadow = true;



		return hexagon;





	}


	setLights() {

		const light = new THREE.PointLight( 0xFFFFFF, 1 );
		light.name = 'pointlight';
		light.position.set( 0, 0, 5 );

        
        this.backLight = new THREE.PointLight( new Color( '#ffffff' ), 1 );
		this.backLight.name = 'pointlight2';
		this.backLight.position.set( 0, 0, -5 );

		const ambLight = new THREE.AmbientLight( 0xdedede );
        ambLight.name = 'ambLight';
        
       // this.scene.add( new DirectionalLight(0xffffff, 10.0));

		this.scene.add( this.backLight  );

	}


	resize( w, h ) {

		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( w, h );

		if (window.innerWidth <= 600) {

			this.mobile = true;

		}

	}

	update( time ) {

		this.raycaster.setFromCamera( this.mouse3D, this.camera );

		const intersects = this.raycaster.intersectObjects( [ this.floor ] );

		if ( intersects.length ) {

			const { x, y } = intersects[ 0 ].point;

			for ( let i = 0; i < this.grid.cols; i ++ ) {

				for ( let j = 0; j < this.grid.rows; j ++ ) {

					const hexagon = this.hexagonArray[ i ][ j ];

					const mouseDistance = Utils.distance( x, y,
						hexagon.position.x + this.container.position.x,
						hexagon.position.y + this.container.position.y );

					const maxPositionY = 7;
					const minPositionY = 4;
					const startDistance = 3;
					const endDistance = 0;
					const z = Utils.map( mouseDistance, startDistance, endDistance, minPositionY, maxPositionY );

					TweenMax.to( hexagon.position, 3, {
						ease: SlowMo.ease.config( 0.1, 2, false ),
						x: hexagon.initialPosition.x,
						y: hexagon.initialPosition.y,
						z: ( hexagon.initialPosition.z + ( Utils.clamp( z, 0, 8 ) * 0.5 ) ),
					} );


				}

			}

			this.backLight.position.set( x, y, - 5 );


		}

        const dt = this.clock.getDelta();
        
		
        this.renderer.render( this.scene, this.camera );

	}



}