if(typeof control==="undefined"){control={};}
if(typeof control.feedback==="undefined"){control.feedback={};}
$.extend(control.feedback,{
    init:function(){
        this.cont=$("#feed_cont");
        this.template='\
        {{#notes}}\n\
            <div id="feed_notes_{{id}}" class="feed_note"><span class="feed_note_author" style="color:{{color}}">{{author}}:</span>{{text}}</div>\
        {{/notes}}\n\
        ';
        var endtempl='\
        <div id="feed_note_cont"></div>\n\
        <div id="feed_inarea">\n\
            <input id="feed_author" class="feed_input" />\n\
            <textarea id="feed_text" class="feed_input" />\n\
            <button id="feed_send" >Send</button>\n\
        </div>\n';
        this.cont.html(endtempl);
        this.input_author=$("#feed_author");
        this.input_text=$("#feed_text");
        this.input_send=$("#feed_send").on("click",$.proxy(this.send,this));
        this.notecont=$('#feed_note_cont');
        this.render([]);
        this.watermark();
        this.getData();
    },
    render:function(obj){
        var rendered=Mustache.render(this.template,this.prerenderData(obj));
        this.notecont.html(rendered);
    },
    watermark:function(){
        this.input_author.Watermark("Author");
        this.input_text.Watermark("Your suggestion");
    },
    getData:function(){
        $.ajax({
            url:"../database/getData.php",
            type:"post",
            dataType:"json"
        })
        .done(function(data){
            control.feedback.render(data);
        });
    },
    send:function(){
        $.ajax({
            url:"../database/addLine.php",
            type:"post",
            dataType:"json",
            data:{
                author:this.input_author.val(),
                text:this.input_text.val()
            }
        })
        .done(function(data){
            control.feedback.render(data);
        });
        this.input_author.val("");
        this.input_text.val("");
        this.watermark();
        
    },
    prerenderData:function(data){
        for(var i=0;i<data.length;i++){
            data[i].color=this.getColor(data[i].author);
            data[i].id=i;
        }
        return {notes:data};
    },
    getColor:function(name){
        function hashCode(str) { // java String#hashCode
            var hash = 0;
            for (var i = 0; i < str.length; i++) {
               hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }
        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }
        var i=hashCode(name);
        return "#"+componentToHex((i>>16)&0xFF) + 
               componentToHex((i>>8)&0xFF) + 
               componentToHex(i&0xFF);

    }
});
