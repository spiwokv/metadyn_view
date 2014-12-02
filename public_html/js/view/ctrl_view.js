/** @license magnet:?xt=urn:btih:1f739d935676111cfff4b4693e3816e664797050&dn=gpl-3.0.txt GPL-v3-or-Later
* Copyright (C) 2014  Petr Hošek
*/
if(window.view===undefined){var view={};}
if(view.ctrl===undefined){view.ctrl={};}
$.extend(view.ctrl,{
    template:"",
    div:null,
    tooltipdiv:null,
    tooldelay:false,
    ctrlRequested:false,
    width:600,
    inited:false,
    resizing:false,  // event 
    temp:{resizepos:false,resoldata:[16,64,128,256,512],speeddata:[0.01,0.03,0.1,0.3,1,3,10,30,100]},
    tips:{play:"Play",stop:"Stop",measure:"Measure",loop:"Loop",resize:"Resize",glwant:"WebGL",resol:"Resolution",reset:"Reset",pict:"Picture",slider:"Slider",speed:"Speed"},
    //settings:{play:false,measure:false,loop:true,resize:false,resol:100},  // temporary
    init:function(){
        var sett=control.settings;
        this.div=$("#ctrl_cont");
        this.tooltipdiv=$("#tooltip");
        this.slide.init();
        $.get("templates/ctrl.html",$.proxy(function(data){
            this.template=data;
            this.redraw();
            this.bind();
            this.inited=true;
        },this),"text");
        control.control.everytick(this,"render");
        control.control.everytick(this,"resize");
        sett.play.subscribe(this,"draw");
        sett.loop.subscribe(this,"draw");
        sett.glwant.subscribe(this,"draw");
        sett.measure.subscribe(this,"draw");
        sett.resol.subscribe(this,"draw");
        sett.speed.subscribe(this,"draw");

    },
    getSettings:function(){
        var sett=control.settings;
        return {
            play:sett.play.get(),
            measure:sett.measure.get()?"on":"",
            loop:sett.loop.get()?"on":"",
            resol:sett.resol.get(),
            resize:(!!this.temp.resizepos)?"on":"",
            speed:sett.speed.get(),
            webgl:sett.glwant.get()?"on":""
        };
    },
    render:function(){
        if(this.ctrlRequested){
            var vars={sett:this.getSettings()},
            rendered=Mustache.render(this.template,vars);
            this.div.html(rendered);
            //manage.console.debug("CTRL redrawed");
            this.ctrlRequested=false;
        }
    }, 
    redraw:function(){
        if(this.ctrlRequested){return;}
        this.ctrlRequested=true;
    },
    bind:function (){
        //var thisctrl=this;
        this.div
        .on("click","div.ctrl",$.proxy(function(event){
            var ctrl,ctrlSel,val,template,data,obj,rendered,sett;
            sett=control.settings;
            ctrl=event.currentTarget.getAttribute("data-ctrl");
            //alert(ctrl);
            if(ctrl==="resol" ||ctrl ==="speed"){
                ctrlSel=$("#ctrl_select");
                if(ctrlSel.is(":visible")){ctrlSel.hide();return;}
                this.temp.$ctrlSel=ctrlSel;
                if(ctrl==="resol"){
                    val=sett.resol.get();
                    template='{{#poss}}<div class="sel {{sel}}" data-val={{val}}>{{val}}px</div>{{/poss}}';
                    data=this.temp.resoldata;
                }else{
                    val=sett.speed.get();
                    template='{{#poss}}<div class="sel {{sel}}" data-val={{val}}>{{val}} x</div>{{/poss}}';
                    data=this.temp.speeddata;
                }
                obj=this.preMustache(data,val);
                //resoldata=$.extend({},this.temp.resoldata);
                rendered=Mustache.render(template,{poss:obj});
                //$(rendered).val(val);
                this.summonSelect(event.currentTarget,rendered,function(event){
                    sett[ctrl].set(parseInt(event.target.getAttribute("data-val"),10));
                    $("#ctrl_select").hide();
                });
                return;
                //control.settings.resol.set((val)%500+100);
            }if(ctrl==="resize"){
                return;
            }if(ctrl==="loop" || ctrl==="measure" || ctrl==="play" || ctrl==="glwant"){
                sett[ctrl].toggle();return;
            }if(ctrl==="reset"){
                control.control.reset();return;
            }if(ctrl==="pict"){
                sett.png.toggle();return;
            }
            
        },this))
        .on("mousedown","#resize_ctrl",$.proxy(function(event){
            //this.settings.resize=true;
            var div=$("#main_cont");
            this.stopTip();
            this.temp.resizepos={x:event.pageX-div.width(),y:event.pageY-div.height()};
            $("body").on("mousemove",$.proxy(function(event){
                this.resizing=event;
                this.stopTip();
            },this));
            $("body").on("mouseup",$.proxy(function(event){
                //this.settings.resize=false;
                this.temp.resizepos=false;
                this.redraw();
                //this.resize(event);
                $("body").off("mousemove");
                $("body").off("mouseup");
                $("body").off("mouseout");
            },this));
            /*$("body").on("mouseout",$.proxy(function(event){
                this.render();
                this.resize(event);
                this.settings.resize=false;
                $("body").off("mousemove");
                $("body").off("mouseup");
                $("body").off("mouseout");
            },this));*/
            this.redraw();
            
            
        },this));
        this.bindTips(this.div,this.tips);
    },
    preMustache:function(arr,val){
        var data=[],i;
        for(i=0;i<arr.length;i+=1){
            data.push({val:arr[i],sel:val===arr[i]?"on":""});
        }
        return data;
    },
    summonSelect:function(ctrl,rendered,callback){
        var div=this.temp.$ctrlSel,
        off = $(ctrl).position();
        div.css({"left":off.left+"px"});
        div.html(rendered);
        div.show();
        div.children("div").click(callback);
    },
    resize:function(optWid,optHei){
        var wid,hei,sqdif;
        /*$("#cont").css({width:Math.max(400,event.pageX-this.temp.resizepos.x)+"px"});
        $("#main_cont").css({height:Math.max(300,event.pageY-this.temp.resizepos.y)+"px"});
        view.axi.arrange();*/
        if(optHei === undefined){
            if(this.resizing===false){return;}
            wid=Math.max(400,this.resizing.pageX-this.temp.resizepos.x);
            hei=Math.max(300,this.resizing.pageY-this.temp.resizepos.y);
        }else{
            wid=optWid;
            hei=optHei;
        }
        sqdif=view.axi.isSquare(wid,hei);
        if(sqdif!==0){
            wid-=sqdif;
            hei+=sqdif;
        }
        this.width=wid;
        $("#cont").css({width:wid+"px"});
        $("#main_cont").css({height:hei+"px"});
        view.axi.needArrange=true;
        view.ctrl.slide.render();
        control.gestures.needRecompute=true;
        control.control.needRedraw=true;
        this.resizing=false;
    },
    bindTips:function(div,tips){
        div
        .on("mouseover","div.ctrl:not(.notip)",$.proxy(function(event){
            //var ctrl=$(event.currentTarget).attr("data-ctrl");
            var tar=event.currentTarget;
            //manage.console.debug("CTRL="+$(tar).attr("id"));
            this.tooldelay=setTimeout(function(){
                //manage.console.debug("showtip="+$(div).attr("id"));
                view.ctrl.showTooltip(tar,tips);
            },1500);
        },this))
        .on("mouseout","div.ctrl",$.proxy(this.stopTip,this));
        
    },
    showTooltip:function(ctrldiv,tips){
        var ctrl,off,
        $ctrl=$(ctrldiv);
        if($ctrl.is(":hidden")){return;}
        if(!tips){tips=this.tips;}
        //manage.console.debug("caller is " + arguments.callee.caller.toString());
        //manage.console.debug("CTRL="+$(ctrldiv).attr("id"));
        ctrl=$ctrl.attr("data-ctrl");
        off = $ctrl.offset();
        this.tooltipdiv.css({"left":(off.left)+"px","top":(off.top+25)+"px"});
        this.tooltipdiv.html(Lang(tips[ctrl]));
        this.tooltipdiv.show();
    },
    stopTip:function(){
        if(this.tooldelay!==false){
            clearTimeout(this.tooldelay);
            this.tooldelay=false;
            this.tooltipdiv.hide();
        }
    },
    notify:function(args){
        if(args==="draw"){this.ctrlRequested=true;}
        if(args==="render"){this.render();}
        if(args==="resize"){this.resize();}
        
    }
});
view.ctrl.slide={
    eventpos:null,
    ctrl:view.ctrl,
    slider:null,
    template:"",
    ratio:0.0,
    init:function(){
        $.get("templates/slide.html",$.proxy(function(data){
            var rendered=Mustache.render(data,{left:this.left()});
            this.template=data;
            $("#slide_cont").html(rendered);
            //this.render();
            this.slider=$("#slider");
            this.cont=$("#slide_cont");
            this.bind();
        },this),"text");
    },
    left:function(){
        return Math.round((this.ctrl.width-20)*this.ratio);
    },
    toratio:function(val){
        return Math.max(Math.min(val/(this.ctrl.width-20),1),0);
    },
    byratio:function(val){
        this.ratio=val;
        this.render();
    },
    render:function(){
        this.move(this.left());
    },
    bind:function(){
        this.cont
        .on("mousedown","#slider",$.proxy(function(event){
            this.eventpos=event.pageX-$("#slider").position().left;
            control.settings.play.set(false);
            event.preventDefault();
            //view.ctrl.render();
            $("body").on("mousemove",$.proxy(function(event){
                //manage.console.debug("mouse.which="+event.which);
                //if(event.which!==1){this.mouseup(event);}
                var lft=event.pageX-this.eventpos,
                ratio=this.toratio(lft);
                this.byratio(ratio);
                //control.control.set(ratio);
                //this.move(lft);
                //$("#slider").css("left",Math.max(Math.min(event.pageX-this.eventpos,this.ctrl.width-10),0));
            },this));
            $("body").on("mouseup",$.proxy(this.mouseup,this));
        },this));
    },
    mouseup:function(event){
        $("body").off("mousemove");
        $("body").off("mouseup");
        $("body").off("mouseout");
        this.eventpos=false;
        control.control.setWanted(this.ratio);
        
    },
    move:function(lft){
        //manage.console.debug("left="+left);
        //this.left=lft;
        //div.css("left",lft);
        lft=Math.max(Math.min(lft,this.ctrl.width-20),0);
        //manage.console.debug("left="+lft);
        this.slider.css("left",lft);
    }
};
// @license-end