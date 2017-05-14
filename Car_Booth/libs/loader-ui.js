/**
 * 创建加载界面
 */
var LoadingUI = function(options){
    this.parent;
    this.container;
    this.loadingBar;

    options = options || {};
    if(!options.parent){
        throw "parent不能为空";
    }

    var parentDom = ((typeof options.parent=='string')&&options.parent.constructor==String) ?
        document.getElementById(options.parent) : options.parent;
    if(!parentDom){
        throw "parent无效";
    }
    this.parent = parentDom;



    this.init(options);
};

LoadingUI.prototype.init = function(options){
    this.container = document.createElement("div");
    this.container.classList.add("loading-container");
    this.container.style.width = window.innerWidth + "px";
    this.container.style.height =window.innerHeight + "px";

    this.loadingBar = document.createElement("div");
    this.loadingBar.classList.add("loading-bar");
    this.container.appendChild(this.loadingBar);

    var descBar = document.createElement("div");
    descBar.classList.add("loading-desc");
    descBar.innerHTML = "<span>" + (options.desc || "Loading") + "</span>";
    this.container.appendChild(descBar);

    this.parent.appendChild(this.container);

    //this.load3D_();
}

LoadingUI.prototype.load3D_ = function(){
    var containerRect = this.container.getBoundingClientRect();

    var scene3D = document.createElement("div");
    scene3D.classList.add("loading-3d");
    scene3D.style.width = containerRect.width + "px";
    scene3D.style.height = containerRect.height + "px";

    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(45.0, containerRect.width/containerRect.height, 1, 1000);
    camera.position.set(20, 0, 150);
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0x000000, 1.0));
    renderer.setSize(containerRect.width, containerRect.height);
    renderer.shadowMapEnabled = true;
    scene3D.appendChild(renderer.domElement);
    this.container.appendChild(scene3D);

    var cloud = this.createCloud_();
    scene.add(cloud);

    var step = 0;

    function render(){
        cloud.rotation.x + (step += 0.01);
        cloud.rotation.z = step;

        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    render();
}

LoadingUI.prototype.createCloud_ = function(){
    var geom = new THREE.Geometry();

    var material = new THREE.PointCloudMaterial({
        size: 4,
        transparent: true,
        opacity: 0.4,
        vertexColors: true,
        sizeAttenuation: false,
        color: 0xffffff
    });

    var range = 500;
    for(var i = 0; i < 200; i++){
        var particle = new THREE.Vector3(Math.random() * range - range / 2, Math.random() * range - range / 2, Math.random() * range - range / 2);
        geom.vertices.push(particle);
        var color = new THREE.Color(0x00ff00);
        color.setHSL(color.getHSL().h, color.getHSL().s,  Math.random() * color.getHSL().l);
        geom.colors.push(color);
    }

    var cloud = new THREE.PointCloud(geom, material);

    return cloud;
}

/**
 * 增加进度，number必须为0到100的整数
 * @param number
 */
LoadingUI.prototype.setProgress = function(number){
    var num = Math.min(100, Math.max(0, number));
    var currentProgress = Math.floor((num / 10));
    this.loadingBar.innerHTML = "";
    for(var i = 0; i < currentProgress; i++){
        var progressDom = document.createElement("div");
        progressDom.classList.add("loading-progress");
        this.loadingBar.appendChild(progressDom);
    }
}

LoadingUI.prototype.finish = function(){
    this.parent.removeChild(this.container);
}
