/**
 * 作者：heavi
 * 创建于：2017/4/28
 * 说明：模型数据来至于国外某网站
 */
var CarBooth = function(options){
    "use strict";

    if(!(this instanceof CarBooth)){
        throw "请使用CarBooth构造函数创建对象";
    }

    this.width = options.width || window.innerWidth;
    this.height = options.height || window.innerHeight;
    this.renderDomId = options.renderDomId;

    this.scene;
    this.camera;
    this.renderer;
    this.orbitControl;
    this.textureCube;
    this.pointLight;
    this.directionLight;
    this.controls;
    this.carObject3D;

    this.init_(options);
}

/**
 * 初始化环境
 * @param options
 * @private
 */
CarBooth.prototype.init_ = function(options){
    var self = this;

    this.controls = new function(){
        //设置场景参数
        this.sceneX = options.sceneX || 0;
        this.sceneY = options.sceneY || -20;
        this.sceneZ = options.sceneZ || 0;

        //设置摄像头参数
        this.cameraX = options.cameraX || 7;
        this.cameraY = options.cameraY || 40;
        this.cameraZ = options.cameraZ || 97;
        this.cameraLookAtX = options.cameraLookAtX || 0;
        this.cameraLookAtY = options.cameraLookAtY || 0;
        this.cameraLookAtZ = options.cameraLookAtZ || 0;

        //设置轨迹飞行器参数
        this.orbitPolarAngleOffset = options.orbitPolarAngleOffset || 0.005;
        this.orbitMinDistance = options.orbitMinDistance || 110;
        this.orbitMaxDistance = options.orbitMaxDistance || 120;
        this.orbitAutoRotate = options.orbitAutoRotate != undefined ? options.orbitAutoRotate : true;

        //设置灯光参数
        this.pointLightX = options.pointLightX || 0;
        this.pointLightY = options.pointLightY || 50;
        this.pointLightZ = options.pointLightZ || 0;
        this.pointLightIntensity = options.pointLightIntensity || 1.2;
        this.pointLightDistance = options.pointLightDistance || 1000;

        this.directionLightX = options.directionLight || 30;
        this.directionLightY = options.directionLightY || 30;
        this.directionLightZ = options.directionLightZ || 40;
        this.directionLightIntensity = options.directionLightIntensity || 0.72;

        //设置汽车模型参数
        this.carRotateY = options.carRotateY || (-0.25 * Math.PI);
    };

    if(options.debug){
        this.loadDebug_();
    }

    //初始化场景
    this.scene = new THREE.Scene();
    this.scene.position.set(self.controls.sceneX, self.controls.sceneY, self.controls.sceneZ);

    this.camera = new THREE.PerspectiveCamera(45.0, self.width / self.height, 0.1, 1000);
    this.camera.position.set(self.controls.cameraX, self.controls.cameraY, self.controls.cameraZ);
    this.camera.lookAt(new THREE.Vector3(self.controls.cameraLookAtX, self.controls.cameraLookAtY, self.controls.cameraLookAtZ));

    this.renderer = new THREE.WebGLRenderer({antalize: true});
    this.renderer.setClearColor(new THREE.Color(0x000000), 1.0);
    this.renderer.setSize(self.width, self.height);
    this.renderer.shadowMapEnabled = true;

    this.orbitControl = this.createOrbitControl_();
    this.textureCube = this.createCubeMap_();

    var ambientLight = new THREE.AmbientLight(0x050505);
    this.scene.add(ambientLight);

    this.pointLight = new THREE.PointLight(0xffffff);
    this.pointLight.position.set(self.controls.pointLightX, self.controls.pointLightY, self.controls.pointLightZ);
    this.pointLight.intensity = self.controls.pointLightIntensity;
    this.pointLight.distance = self.controls.pointLightDistance;
    this.scene.add(this.pointLight);

    this.directionLight = new THREE.DirectionalLight(0xffffff);
    this.directionLight.intensity = this.controls.directionLightIntensity;
    this.directionLight.position.set(self.controls.directionLightX, self.controls.directionLightY, self.controls.directionLightZ);
    this.scene.add(this.directionLight);

    //初始化汽车模型对象
    this.carObject3D = new THREE.Object3D();
    this.carObject3D.rotation.y = self.controls.carRotateY;
    this.scene.add(this.carObject3D);

    var domParent = document.getElementById(self.renderDomId) || document.body;
    domParent.appendChild(self.renderer.domElement);

    this.render_();
}

/**
 * 更新画布尺寸
 * @param width
 * @param height
 */
CarBooth.prototype.updateSize = function(width, height){
    if(isNaN(width) || isNaN(height)){
        throw "width和height必须是数字";
    }
    this.width = width;
    this.height = height;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width/this.height;
}

/**
 * 加载场景模型
 * @param doneHandler
 * @param progressHandler
 * @param errorHandler
 */
CarBooth.prototype.loadScene = function(doneHandler, progressHandler, errorHandler){
    var self = this;

    var loader = new THREE.SceneLoader();
    loader.load("assets/models/carvisualizer.js", function(object){
        self.loadGarageObjects_(object);
        if(doneHandler){
            doneHandler(object);
        }
    }, progressHandler,errorHandler);
}

/**
 *  加载汽车动态部分，包括车身和车轮
 * @param name
 * @param carObjects
 * @param options bodyColor为车身颜色 |  wheelColor车轮毂颜色。颜色格式为十六进制(例如0xff0000)
 */
CarBooth.prototype.loadCarDynamicPart = function(name, carObjects, options){
    var self = this;
    options = options || {};

    var bodyColor = options.bodyColor;
    var wheelColor = options.wheelColor;
    var wheelPosition = options.wheelPosition;

    var meshName = "car_dynamic_part";
    var object3D = self.carObject3D.getObjectByName(meshName);
    if(object3D){
        self.carObject3D.remove(object3D);
    }

    object3D = new THREE.Object3D();
    object3D.name = meshName;

    var body_mesh = carObjects.objects[name + "_body"];
    if(body_mesh){
        body_mesh.scale.set(0.1, 0.1, 0.1);
        body_mesh.material.materials[0] = new THREE.MeshLambertMaterial({color: (bodyColor || 0xff6600) , envMap: self.textureCube, combine: THREE.MixOperation, reflectivity: 0.3 });
        object3D.add(body_mesh);
    }

    var wheel_mesh = carObjects.objects["wheel"];
    var rim_mesh = carObjects.objects["rim"];
    if(wheel_mesh && rim_mesh){
        var wheelObject3D = new THREE.Object3D();

        wheel_mesh.scale.set(0.1, 0.1, 0.1);
        wheel_mesh.material.materials[0] = new THREE.MeshLambertMaterial({
                map: THREE.ImageUtils.loadTexture("assets/textures/autoparts/wheel.png"),
                combine: THREE.MixOperation,
                envMap: self.textureCube,
                reflectivity: 0.1
            });
        wheelObject3D.add(wheel_mesh);

        rim_mesh.scale.set(0.1, 0.1, 0.1);
       rim_mesh.material.materials[0] = new THREE.MeshLambertMaterial({color: (wheelColor || 0xff6600) , envMap: self.textureCube, combine: THREE.MixOperation, reflectivity: 0.3 });
        wheelObject3D.add(rim_mesh);

        wheelPosition.forEach(function(item){
            var transWheelObject = wheelObject3D.clone();
            transWheelObject.position.x = item.x;
            transWheelObject.position.z = item.z;
            transWheelObject.rotation.y = item.rotateY;

            object3D.add(transWheelObject);
        });
    }

    self.carObject3D.add(object3D);
}

/**
 * 加载汽车静态部分，包括防护栏、玻璃、内饰
 * @param name
 * @param carObjects
 */
CarBooth.prototype.loadCarStaticPart = function(name, carObjects, options){
    if(!name){
        throw "name不能为空";
    }

    if(!carObjects){
        throw "carObjects不能为空";
    }

    options = options || {};

    var textueName = options.textureName || name;

    var self = this;
    var meshName = "car_static_part";

    var object3D = self.carObject3D.getObjectByName(meshName);
    if(object3D){
        self.carObject3D.remove(object3D);
    }

    object3D = new THREE.Object3D();
    object3D.name = meshName;

    var bumper_mesh = carObjects.objects[name + "_bumper"];
    if(bumper_mesh){
        bumper_mesh.scale.set(0.1, 0.1, 0.1);
        bumper_mesh.material.materials[0] = new THREE.MeshLambertMaterial({ color: 0x312520, envMap: self.textureCube, combine: THREE.MixOperation, reflectivity: 0.3 });

        object3D.add(bumper_mesh);
    }

    var glass_mesh = carObjects.objects[name + "_glass"];
    if(glass_mesh){
        glass_mesh.scale.set(0.1, 0.1, 0.1);
        var glass_material = glass_mesh.material.materials[0] = new THREE.MeshLambertMaterial({
            color: 0x312520,
            envMap: self.textureCube,
            combine: THREE.MixOperation,
            reflectivity: 0.3,
            transparent: true,
            opacity: 0.5
        });
        //glass_material.transparent = true;
        //glass_material.side = THREE.DoubleSide;
        //glass_material.envMap = self.textureCube;
        //glass_material.opacity = 0.4;
        object3D.add(glass_mesh);
    }

    var interior_mesh = carObjects.objects[name + "_interior"];
    if(interior_mesh){
        interior_mesh.scale.set(0.1, 0.1, 0.1);
        var interior_material = interior_mesh.material.materials[0] = new THREE.MeshLambertMaterial({
            map: THREE.ImageUtils.loadTexture("assets/textures/" + textueName + "/i01.jpg"),
            combine: THREE.MixOperation
        });;
        object3D.add(interior_mesh);
    }

    var shadow_mesh = carObjects.objects["car_shadow"];
    if(shadow_mesh){
        shadow_mesh.scale.set(0.1, 0.1, 0.1);
        var shadow_material = shadow_mesh.material.materials[0];

        THREE.ImageUtils.loadTexture("assets/textures/" + textueName + "/s01.png", THREE.Texture.DEFAULT_MAPPING, function(texture){
            shadow_material.map = texture;
            shadow_material.transparent = true;
            shadow_material.needsUpdate = true;
        });

        object3D.add(shadow_mesh);
    }

   self.carObject3D.add(object3D);
}

/**
 * 加载控制面板
 * @private
 */
CarBooth.prototype.loadDebug_ = function(){
    var self  = this, controls = this.controls;
    controls.change = function(){
        self.pointLight.position.set(controls.pointLightX, controls.pointLightY, controls.pointLightZ);
        self.directionLight.position.set(controls.directionLightX, controls.directionLightY, controls.directionLightZ);
        self.directionLight.intensity = controls.directionLightIntensity;

        self.scene.position.set(self.controls.sceneX, self.controls.sceneY, controls.sceneZ);
        self.camera.position.set(self.controls.cameraX, self.controls.cameraY, controls.cameraZ);
    }

    var gui = new dat.GUI();
    gui.addFolder("Light");
    gui.add(controls, "pointLightX", -1000, 1000).onChange(controls.change);
    gui.add(controls, "pointLightY", -1000, 1000).onChange(controls.change);
    gui.add(controls, "pointLightZ", -1000, 1000).onChange(controls.change);
    gui.add(controls, "directionLightX", -1000, 1000).onChange(controls.change);
    gui.add(controls, "directionLightY", -500, 500).onChange(controls.change);
    gui.add(controls, "directionLightZ", -500, 500).onChange(controls.change);
    gui.add(controls, "directionLightIntensity", 0, 1).onChange(controls.change);
    gui.add(controls, "sceneX", -150, 150).step(10).onChange(controls.change);
    gui.add(controls, "sceneY", -150, 150).step(10).onChange(controls.change);
    gui.add(controls, "sceneZ", -150, 150).step(10).onChange(controls.change);
    gui.addFolder("Camera");
    gui.add(controls, "cameraX", -150, 150).step(10).onChange(controls.change);
    gui.add(controls, "cameraY", -150, 150).step(10).onChange(controls.change);
    gui.add(controls, "cameraZ", -150, 150).step(10).onChange(controls.change);
}

/**
 * 创建轨迹飞行器
 * @returns {THREE.OrbitControls}
 * @private
 */
CarBooth.prototype.createOrbitControl_ = function(){
    var self = this;

    var orbitControl = new THREE.OrbitControls(self.camera);
    orbitControl.maxPolarAngle = (0.5 + self.controls.orbitPolarAngleOffset) * Math.PI;
    orbitControl.minPolarAngle = (0.5 - self.controls.orbitPolarAngleOffset) * Math.PI;
    orbitControl.minDistance = self.controls.orbitMinDistance;
    orbitControl.maxDistance = self.controls.orbitMaxDistance;
    orbitControl.userPan = false;
    orbitControl.autoRotate = self.controls.orbitAutoRotate;
    //如果userPan设置为false，禁止右键平移场景
    document.getElementById("webgl-output").addEventListener("mousedown", function(event){
        if(event.button === 2){
            if(orbitControl.userPan === false){
                event.preventDefault();
                if(event.stopPropagation) event.stopPropagation();
                else event.cancelBubble = true;
            }
        }
    }, false);

    return orbitControl;
}

/**
 * 创建CubeMap
 * @returns {*}
 * @private
 */
CarBooth.prototype.createCubeMap_ = function() {
    var path = "assets/textures/garage/";
    var format = ".jpg";

    var urls = [
        path + "positiveX" + format, path + "negativeX" + format,
        path + "positiveY" + format, path + "negativeY" + format,
        path + "positiveZ" + format, path + "negativeZ" + format
    ];

    var textureCube = THREE.ImageUtils.loadTextureCube(urls, THREE.CubeReflectionMapping);

    return textureCube;
}

/**
 * 加载车库环境，只加载一次
 * @param object
 * @private
 */
CarBooth.prototype.loadGarageObjects_ = function(object){
    var self = this;
    var garageObject3D = new THREE.Object3D();
    garageObject3D.name = "garage_object3d";

    //渲染floor网格
    var floor_mesh = object.objects["floor"];
    floor_mesh.scale.set(0.1, 0.1, 0.1);

    var floor_texture = THREE.ImageUtils.loadTexture("assets/textures/garage/floor.jpg");
    var floor_material = floor_mesh.material.materials[0];
    floor_texture.wrapS = THREE.RepeatWrapping;
    floor_texture.wrapT = THREE.RepeatWrapping;
    floor_texture.repeat.set(10, 10);
    floor_material.map = floor_texture;
    floor_material.color = new THREE.Color(0xffffff, 0.0);

    garageObject3D.add(floor_mesh);

    //渲染floor_shadow网格
    var floor_shadow_mesh = object.objects["floor_shadow"];
    floor_shadow_mesh.scale.set(0.1, 0.1, 0.1);

    var floor_shadow__texture = THREE.ImageUtils.loadTexture("assets/textures/garage/floorShadow.png");
    var floor_shadow_material = floor_shadow_mesh.material.materials[0];
    floor_shadow_material.map = floor_shadow__texture;
    floor_shadow_material.color = new THREE.Color(0xffffff, 0.0);
    floor_shadow_material.transparent = true;

    garageObject3D.add(floor_shadow_mesh);

    //渲染garage网格
    var garage_mesh = object.objects["garage"];
    garage_mesh.scale.set(0.1, 0.1, 0.1);
    var garage_texture = THREE.ImageUtils.loadTexture("assets/textures/garage/garage.jpg");
    var garage_material = garage_mesh.material.materials[0];
    garage_material.map = garage_texture;
    garage_material.color = new THREE.Color(0xffffff, 0.0);

    garageObject3D.add(garage_mesh);

    self.scene.add(garageObject3D);
}

/**
 * 循环渲染
 * @private
 */
CarBooth.prototype.render_ = function(){
    var self = this;
    self.directionLight.position.copy(self.camera.position);
    self.orbitControl.update();
    requestAnimationFrame(function(){
        self.render_.apply(self);
    });
    self.renderer.render(self.scene, self.camera);
}

window.onload = function(){
    if(!window.eventDispatcher){
        throw "未加载eventDispatcher库";
    }

    var loadingUI = new LoadingUI({parent: document.body, desc:　"Car Booth"});

    var carBooth = new CarBooth({renderDomId: "webgl-output", orbitAutoRotate: true, debug: false});
    carBooth.loadScene(function(object){
        var currentCar = {name: "lancer", textureName: "lancer", bodyColor: 0xff6600, wheelColor: 0x222222};

        var exChangeCar = function(car){
            car = car || {};

            currentCar.name = car.name || currentCar.name;
            currentCar.textureName = car.textureName || currentCar.textureName;
            currentCar.bodyColor = car.bodyColor || currentCar.bodyColor;
            currentCar.wheelColor = car.wheelColor || currentCar.wheelColor;

            carBooth.loadCarStaticPart(currentCar.name, object, {textureName: currentCar.textureName });
            carBooth.loadCarDynamicPart(currentCar.name, object, {bodyColor: currentCar.bodyColor, wheelColor: currentCar.wheelColor, wheelPosition: Wheels.wheelLocations[currentCar.name]});
        }
        exChangeCar();

        window.eventDispatcher.on("carChange", function(event){
            if(event.data){
                exChangeCar(event.data);
            }
        });
        setTimeout(function(){
            loadingUI.finish();
            window.eventDispatcher.dispatchEvent("onload", currentCar);
        }, 800);
        window.addEventListener("resize", function(){
            carBooth.updateSize(window.innerWidth, window.innerHeight);
        });
    }, function(event){
        loadingUI.setProgress(100 * (event.loaded/event.total));
    }, function(event){

    });
}




