(function(){
'use strict';
var CMS=window.CMS,h=window.h,I=window.Immutable;
if(!CMS || !h || !I || !window.createClass) throw new Error('Photothèque : dépendance indisponible');
var labels={enseignes:'Enseignes et totems',vehicules:'Marquage de véhicules',signaletique:'Signalétique et adhésifs',textiles:'Textiles',imprimerie:'Imprimerie',objets:'Objets publicitaires'};
function plain(v){return v&&typeof v.toJS==='function'?v.toJS():v;}
function rows(v){v=plain(v);return Array.isArray(v)?v.filter(function(p){return p&&(p.title||p.image||p.category||(p.additional_images||[]).length);}):[];}
function extras(p){return (Array.isArray(p.additional_images)?p.additional_images:[]).map(function(x){return typeof x==='string'?x:x&&x.image;}).filter(Boolean);}
function btn(t,fn,cl){return h('button',{type:'button',className:cl||'',onClick:fn},t);}
var Control=window.createClass({
 getInitialState:function(){return {filter:'all',edit:null,draft:null};},
 componentDidMount:function(){this.controlID='lmd-photo-'+Math.random().toString(36).slice(2);},
 componentDidUpdate:function(){var p=this.props, paths=p.mediaPaths, selected=paths&&paths.get&&paths.get(this.controlID);if(selected&&this.pending&&this.state.draft){var target=this.pending;this.pending=null;var values=plain(selected);if(!Array.isArray(values))values=[values];values=values.filter(function(x){return typeof x==='string'&&x;});if(values.length){var d=Object.assign({},this.state.draft);if(target==='image')d.image=values[0];else d.additional_images=extras(d).concat(values);this.setState({draft:d});}if(p.onRemoveInsertedMedia)p.onRemoveInsertedMedia(this.controlID);}},
 componentWillUnmount:function(){if(this.props.onRemoveMediaControl)this.props.onRemoveMediaControl(this.controlID);},
 isValid:function(){return this.state.draft?{error:{message:'Validez ou annulez la réalisation en cours avant de publier.'}}:true;},
 change:function(a){this.props.onChange(I.fromJS(a));},
 start:function(i){var a=rows(this.props.value),d=i===-1?{title:'',image:'',category:'',additional_images:[]}:Object.assign({},a[i]);d.additional_images=extras(d);this.setState({edit:i,draft:d});},
 set:function(k,v){var d=Object.assign({},this.state.draft);d[k]=v;this.setState({draft:d});},
 pick:function(k){var p=this.props;if(!p.onOpenMediaLibrary){alert('Bibliothèque indisponible. Utilisez le champ URL.');return;}this.pending=k;p.onOpenMediaLibrary({controlID:this.controlID,forImage:true,allowMultiple:k!=='image',value:k==='image'?this.state.draft.image:[],config:I.Map(),field:p.field});},
 save:function(){var d=this.state.draft;if(!d.title.trim()||!d.image||!labels[d.category]){alert('Renseignez le titre, la photo principale et la catégorie.');return;}var a=rows(this.props.value);if(this.state.edit===-1)a.unshift(d);else a[this.state.edit]=d;this.change(a);this.pending=null;this.setState({edit:null,draft:null,filter:'all'});},
 remove:function(i){var a=rows(this.props.value);if(confirm('Supprimer cette réalisation de la galerie ? Les fichiers photos ne seront pas supprimés.')){a.splice(i,1);this.change(a);}},
 move:function(i,n){var a=rows(this.props.value),j=i+n;if(j<0||j>=a.length)return;var x=a[i];a[i]=a[j];a[j]=x;this.change(a);},
 photo:function(src,alt){var url=src||'';try{if(src&&this.props.getAsset){var a=this.props.getAsset(src,this.props.field);if(a)url=String(a);}}catch(e){}if(!/^(https?:\/\/|\/(?!\/)|blob:)/i.test(url))url='';return url?h('img',{src:url,alt:alt||'',loading:'lazy',onError:function(e){e.currentTarget.style.visibility='hidden';}}):h('div',{className:'lmd-placeholder'},'Aucune photo');},
 render:function(){var self=this,a=rows(this.props.value),s=this.state,d=s.draft;
 function field(label,node){return h('label',{className:'lmd-field'},label,node);}
 function select(value,change,all){return h('select',{value:value,onChange:function(e){change(e.target.value);}},[h('option',{key:'none',value:all?'all':''},all?'Toutes les catégories':'Choisir une catégorie')].concat(Object.keys(labels).map(function(k){return h('option',{key:k,value:k},labels[k]);})));}
 function input(v,fn,placeholder){return h('input',{type:'text',value:v||'',placeholder:placeholder,onChange:function(e){fn(e.target.value);}});}
 if(d)return h('div',{className:'lmd-gallery'},h('h2',{},s.edit===-1?'Nouvelle réalisation':'Modifier la réalisation'),field('Titre',input(d.title,function(v){self.set('title',v);},'Titre de la réalisation')),field('Catégorie',select(d.category,function(v){self.set('category',v);},false)),h('h3',{},'Photo principale'),self.photo(d.image,d.title),btn('Choisir / importer une photo',function(){self.pick('image');},'lmd-primary'),field('Ou adresse de la photo',input(d.image,function(v){self.set('image',v);},'https://… ou /images/…')),h('h3',{},'Photos complémentaires'),h('div',{className:'lmd-extras'},extras(d).map(function(x,i){return h('div',{key:i},self.photo(x,''),btn('Retirer',function(){var b=extras(d);b.splice(i,1);self.set('additional_images',b);},'lmd-danger'));})),btn('+ Ajouter des photos',function(){self.pick('additional_images');}),btn('+ Ajouter une adresse URL',function(){var v=prompt('Adresse de la photo :');if(v&&v.trim())self.set('additional_images',extras(d).concat(v.trim()));}),h('div',{className:'lmd-actions'},btn('Annuler',function(){self.pending=null;self.setState({edit:null,draft:null});}),btn('Valider la réalisation',self.save,'lmd-primary')),h('p',{className:'lmd-note'},'Validez ici, puis cliquez sur Publier dans Decap CMS pour enregistrer sur le site.'));
 var cards=a.map(function(p,i){if(s.filter!=='all'&&s.filter!==p.category)return null;return h('article',{className:'lmd-card',key:i},self.photo(p.image,p.title),h('div',{className:'lmd-meta'},h('strong',{},p.title||'Sans titre'),h('small',{},(labels[p.category]||'Sans catégorie')+' · '+(extras(p).length+(p.image?1:0))+' photo(s)'),h('div',{className:'lmd-actions'},btn('Modifier',function(){self.start(i);}),btn('Supprimer',function(){self.remove(i);},'lmd-danger')),h('div',{className:'lmd-order'},btn('↑',function(){self.move(i,-1);}),btn('↓',function(){self.move(i,1);}))));}).filter(Boolean);
 return h('div',{className:'lmd-gallery'},h('div',{className:'lmd-header'},h('h2',{},'Photothèque · '+a.length),btn('+ Ajouter une réalisation',function(){self.start(-1);},'lmd-primary')),field('Filtrer par activité',select(s.filter,function(v){self.setState({filter:v});},true)),h('div',{className:'lmd-grid'},cards.length?cards:h('p',{},'Aucune réalisation dans cette catégorie.')),h('p',{className:'lmd-note'},'Les modifications sont enregistrées sur le site après publication.'));
 }
});
CMS.registerWidget('lmd_phototheque',Control);
CMS.registerPreviewStyle('/admin/phototheque.css');
})();
