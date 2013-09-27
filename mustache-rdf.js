// need this function
if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

function MustacheRDF(rdf, ns) {
  this.rdf = rdf;
  this.ns = ns;

  this.reg = /{{(.*?)}}/g; // this is for curly brackets
  
  this.loopBlock = /{{#(.*?)}}([\s\S]*?){{\/}}/g;
  this.singleBlock = /{{\.}}/g;

  this.loop = /<div\b[^>]*>((?!<\/?div\b).)*<div/g;

  this.init();
}
MustacheRDF.prototype.init = function() {
  var that = this;

  // do loop
  var loopReplaced = $('body').html().replace(this.loopBlock, function(){
    //console.log(arguments);
    var htmlToLoop = arguments[2];
    var triple = arguments[1]; 

    var html = '';
    var obj = that.findPattern(triple);
    var arr = obj.matches;

    for(var i in arr) {
      html += htmlToLoop.replace(that.reg, function() {
        // {{?s rdfs:label ?label}} -> {{cco:xx rdfs:label ?label}}
        // transform the variable found into full uri
        var triple = arguments[1]; 
        if(triple == '.') {
          return arr[i];
        } else {
          triple = triple.replace(obj.argName, arr[i]);

          var a = that.findPattern(triple).matches;
          return a[0];
        }
      });
      
    }
    return html;
  });
  $('body').html(loopReplaced);

  // replace all instance of curly
  var replaced = $('body').html().replace(this.reg, function() {
    var triple = arguments[1]; 

    var arr = that.findPattern(triple).matches;
    
    return arr[0];
  });

  $('body').html(replaced);
}

MustacheRDF.prototype.expandTriple = function(triple) {
  // break it into triples, they're separated by space
  var tripleArr = triple.split(' ');

  // for each triple, see if it starts with a namespace in this.ns
  for(var i in tripleArr) {

    // replace 'a' with rdf:type
    if(tripleArr[i] == 'a') {
      tripleArr[i] = 'rdf:type';
    }

    // expand namespaces
    for(var n in this.ns) {
      if(tripleArr[i].startsWith(n)) {
        tripleArr[i] = tripleArr[i].replace(n, this.ns[n], 'g'); 
        break;
      }
    }

  }

  return tripleArr;
}
MustacheRDF.prototype.findTriple = function(triple) {
  var ret = {};
  ret.matches = [];

  var arg = ['subject', 'predicate', 'object'];

  // supporting only 1 arg for now
  for(var x in triple) {
    if(triple[x].startsWith('?')) {
      arg = arg[x];
      ret.argName = triple[x];
      break;
    }
  }

  for(var i in this.rdf) {
    var subject = this.rdf[i].subject;
    var predicate = this.rdf[i].predicate;
    var object = this.rdf[i].object;

    if(
      (triple[0].startsWith('?') || triple[0] == subject)
      &&
      (triple[1].startsWith('?') || triple[1] == predicate)
      &&
      (triple[2].startsWith('?') || triple[2] == object)
    ){
      // matched
      var str = this.rdf[i][arg];
      str = $.trim(str);
      str = str.replace(/^\\n|\\n$/g, ''); // remove newline from beginning and end
      str = str.replace(/\\n/g, '<br>');
      ret.matches.push(str);

    }

  }

  return ret;
}

MustacheRDF.prototype.findPattern = function(triple) {
  var tripleArr = this.expandTriple(triple);

  var obj = this.findTriple(tripleArr);
  return obj;
}

