/**
 * UI交互控制
 */

if(!window.eventDispatcher){
    throw "未加载eventDispatcher库";
}

window.eventDispatcher.on("onload", function(event){
    var webglOutput = document.getElementById("webgl-output");
    //webglOutput.style.width = window.innerWidth + "px";
    //webglOutput.style.height = window.innerHeight + "px";

    var scene3d = document.getElementById("scene3d");
    scene3d.style.display = "inherit";

    //处理汽车交换器
    var menus = document.createElement("div");
    menus.classList.add("car-menus");
    menus.style.visibility = "hidden";
    var cars = [
        { name: "aston", textureName: "aston", text: "ASTON MARTIN V8"},
        { name: "audi", textureName: "audi", text: "AUDI S3"},
        { name: "ferrari", textureName: "california", text: "FERRARI CALIFORNIA"},
        { name: "camaro", textureName: "camaro", text: "CHEVROLET CAMARO"},
        { name: "lancer", textureName: "lancer", text: "MITSUBISHI LANCER"},
        { name: "mercedes", textureName: "mercedes", text: "MERCEDES SLR 500"},
        { name: "mazda", textureName: "mazda", text: "MAZDA 3"},
        { name: "nissan", textureName: "nissan", text: "NISSAN 350Z"}
    ];

    cars.forEach(function(car){
        var menu = document.createElement("div");
        menu.classList.add("car-menu-item");
        menu.setAttribute("name", car.name);
        menu.setAttribute("textureName", car.textureName);

        menu.innerHTML = toStringWithArgs("<span class='car-target'>{0}</span>", car.text);
        menus.appendChild(menu);
    });
    document.body.appendChild(menus);

    var carExchangeBtn = document.getElementById("carExchangeBtn");
    carExchangeBtn.addEventListener("click", function(event){
        if(menus.style.visibility === "hidden"){
            var boundingRect = carExchangeBtn.getBoundingClientRect();
            menus.style.left = boundingRect.left +  (boundingRect.width / 2)+ "px";
            menus.style.visibility = "visible";
        }else{
            menus.style.visibility = "hidden";
        }

        event.preventDefault();
        if(event.stopPropagation) event.stopPropagation();
        else event.cancelBubble = true;
    });
    menus.addEventListener("click", function(event){
        var target = event.target;
        var classList = target.classList;
        if(classList.contains("car-target")){
            target = target.parentElement;
        }

        var name = target.getAttribute("name"),
            textureName = target.getAttribute("textureName"),
            text = target.innerText;
        carExchangeBtn.children[0].innerHTML = text;

        if(window.eventDispatcher){
            window.eventDispatcher.dispatchEvent("carChange",{name: name, textureName: textureName});
        }

        event.preventDefault();
        if(event.stopPropagation) event.stopPropagation();
        else event.cancelBubble = true;
    });

    //设置车身和轮胎颜色按钮
    var colorButtons = [
        {domId: "carColorBtn", eventName: "updateCarColor", colorPropName: "bodyColor"},
        {domId: "rimColorBtn", eventName: "updateWheelColor", colorPropName: "wheelColor"}
    ];
    colorButtons.forEach(function(carBtn){
        var carBtnDom = document.getElementById(carBtn.domId), isShowingCarJsColor = false;
        carBtnDom.addEventListener("click", function(event){
            var jsColorDom = carBtnDom.querySelector("button");
            if(jsColorDom){
                var jscolor = jsColorDom.jscolor;
                if(!jscolor) return;

                window[carBtn.eventName] = window[carBtn.eventName] || function(picker){
                        var color = picker.toHEXString();
                        jscolor.hide();
                        isShowingCarJsColor = false;
                        carBtnDom.style.backgroundColor = toStringWithArgs("rgba({0}, {1}, {2}, 0.5)", parseInt(picker.rgb[0]), parseInt(picker.rgb[1]), parseInt(picker.rgb[2]));

                        if(window.eventDispatcher){
                            var data = {};
                            data[carBtn.colorPropName] = color;
                            window.eventDispatcher.dispatchEvent("carChange",data);
                        }
                    };

                if(!isShowingCarJsColor) {
                    jscolor.show();
                    isShowingCarJsColor = true;
                }
                else {
                    jscolor.hide();
                    isShowingCarJsColor = false;
                }
            }
        });
    });

    //音乐播放控制
    var audio = document.createElement("audio");
    audio.setAttribute("id", "bgMusic");
    audio.volume = 0.5;
    audio.loop = true;
    audio.setAttribute("src", "assets/audio/bg.mp3");
    audio.play();
    var volumeBtn = document.getElementById("volumeBtn");
    volumeBtn.addEventListener("click", function(event){
        var path = "assets/images/", imgDom = volumeBtn.children[0];
        if(!audio.muted){
            imgDom.src = path + "volumeOff.png";
            audio.muted = true;
        }else{
            imgDom.src = path + "volumeOn.png";
            audio.muted = false;
        }
    });

    //全局控制
    document.addEventListener("click", function(){
        if(menus.style.visibility === "visible"){
            menus.style.visibility = "hidden";
        }
    });

    function toStringWithArgs(){
        var args = arguments;

        if(args.length === 0){
            return undefined;
        }else if(args.length === 1){
            return args[0];
        }else if(args.length > 1){
            var str = args[0];

            for(var i = 1, len = args.length; i < len; i++){
                str = str.replace("{" + (i - 1) + "}", args[i]);
            }

            return str;
        }else{
            return undefined;
        }
    }
});
