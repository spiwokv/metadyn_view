if(typeof control==="undefined"){control={};}
control.measure={
    inited:false,
    needRedraw:true,
    visible:false,
    chillsOn:true,
    diffOn:false,
    data:{
        chills:[],
        xaxi:0,
        yaxi:0,
        ene:0,
        src:0
    },
    init:function(){
        var cont=$('<div id="measure_cont"></div>');
        this.div.$cont=cont;
        $("#side").append(cont);
        /*cont.on("click",".button",$.proxy(function(e){
            this.chillsOn=!this.chillsOn;
            this.needRedraw=true;
        },this));*/
        this.template='\
    <div id=measure_NW" class="measure_NESW" style="float:left">\n\
        <div id="measure_ene_title">{{eneTitle}}: </div>\n\
        <div id="measure_xaxi_title">{{CV1}}: </div>\n\
        {{#yaxi}}<div id="measure_yaxi_title">{{CV2}}: </div>{{/yaxi}}\n\
    </div>\n\
    <div id="measure_NE" class="measure_NESW" style="float:left">\n\
        <div id="measure_ene"><span id=measure_ene_value">{{data.ene}}</span><span id="measure_ene_units"> {{units}}</span></div>\n\
        <div id="measure_xaxi">{{data.xaxi}}</div>\n\
        {{#yaxi}}<div id="measure_yaxi">{{data.yaxi}}</div>{{/yaxi}}\n\
    </div>\n\
    <div id="measure_chills_button" class="ctrl button lclear{{chillsOn}}" data-ctrl="closest_hills">Closest hills</div>\n\
    {{#chillsOn}}\n\
    <div id="measure_chills"><ol class="nomargin">\n\
    {{#data.chills}}\
    <li>{{.}} ps</li>\n\
    {{/data.chills}}\
    </ol></div>\n\
    {{^data.chills}}\n\
    Click where you want find closest hills to\n\
    {{/data.chills}}\n\
    {{/chillsOn}}\
';
        this.inited=true;
    },
    div:{},
    redraw:function(){
        if(!this.visible){return;}
        if(!this.needRedraw){return;}
        
        var rendered=Mustache.render(this.template,{
            units:control.settings.enunit.get()===0?"kJ/mol":"kcal/mol",
            yaxi:control.settings.ncv.get()>1,
            CV1:compute.axi.getName(true),
            CV2:compute.axi.getName(false),
            chillsOn:this.chillsOn?" on":"",
            eneTitle:!this.diffOn?"Bias":"Difference",
            data:this.data
        });
        this.div.$cont.html(rendered);
        /*this.div.$energy=cont.children("#measure_energy");
        this.div.$xaxi=cont.children("#measure_xaxi");
        this.div.$yaxi=cont.children("#measure_yaxi");
        this.div.$chbutton=cont.children("#measure_chills_button");
        this.div.$chills=cont.children("#measure_chills");*/
        this.needRedraw=false;
    },
    show:function(){
        this.visible=true;
        if(!this.inited){this.init();}
        this.div.$cont.show();
    },
    hide:function(){
        this.visible=false;
        this.div.$cont.hide();
    },
    click:function(pos){
        if(!control.settings.measure.get()){return;}
        if(!this.chillsOn){return;}
        pos.y=1-pos.y;
        this.data.chills=this.findChills([pos.x,pos.y]);
        this.needRedraw=true;
    },
    measure:function(pos){
        if(!control.settings.measure.get()){return false;}
        pos.y=1-pos.y;
        var val=this.getValueAt(pos);
        var data=this.data;
        var override=false;
        if(this.diffOn){
            val-=data.src;override=true;
        }
        data.xaxi=compute.axi.getCVval(true,pos.x).toPrecision(3);
        if(control.settings.ncv.get()>1){
            data.yaxi=compute.axi.getCVval(false,pos.y).toPrecision(3);
        }
        data.ene=val.toFixed(1);
        this.needRedraw=true;
        //$("#measure_ctrl_value").html(val.toFixed(1)+" kJ/mol");
        return override;
    },
    setDiff:function(pos){
        if(!control.settings.measure.get()){return;}
        pos.y=1-pos.y;
        var val=this.getValueAt(pos);
        this.data.src=val;
        this.data.ene=0;
        this.diffOn=true;
        this.needRedraw=true;
    },
    unsetDiff:function(){
        if(!control.settings.measure.get()){return;}
        this.diffOn=false;
        this.needRedraw=true;
    },
    getValueAt:function(pos){
        var trans=manage.manager.getTransformed();
        if(trans===null){return 0;}
        var resol=control.settings.resol.get();
        var ncv=control.settings.ncv.get();
        var x,y=0;
        if(ncv===2){
            x=Math.floor(pos.x*resol);
            y=Math.floor(pos.y*resol);
        }else if(ncv===1){
            x=Math.floor(pos.x*resol);
        }
        var val=trans[x+y*resol];
        if(!val){return 0;}else{return val;}
    },
    findChills:function(cvs){
        if(!compute.sum_hill.haveData()){return [];}
        var ihills=compute.sum_hill.findClosestHills(cvs,3);
        var ret=[];
        for(var i=0;i<ihills.length;i++){
            ret.push((compute.sum_hill.artime[ihills[i]]).toFixed(2));
        }
        return ret;
        
    }
    
};