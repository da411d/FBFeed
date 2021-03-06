fb_init(document.getElementById("main"), {
	access_token: "643885529332445|T4LyzZEk64B2mPMeCyQ0kpQgzB4", //Your access token
	app_id: "1234567890123456", //Your app id
	source: "DonaldTrump" //Your feed source
});



function fb_init(el, config){
	if(!config || !config.access_token){
		console.error("No access token provided");
	}
	if(!config || !config.app_id){
		console.error("No app id provided");
	}
	if(!config || !config.source){
		console.error("No source provided");
	}

	if(!document.querySelector(".fb_container")){
		var div = document.createElement("div");
		div.className = "fb_container";
		(el ? el : document.body).appendChild(div);
	}
	Object.prototype.length = function() {
		var len = 0;
		for (a in this) len++;
		return len;
	}
	var loader = {
		start:function(){
			setTimeout(function(){
				var el = document.querySelector("div.loader");
				if(!el){
					var el = document.createElement("div");
					el.className = "loader";
					document.querySelector(".fb_container").appendChild(el);
				}
				el.style.height = "";
			}, 100);
		},
		stop: function(){
			setTimeout(function(){
				var el = document.querySelector(".fb_container div.loader");
				if(el){
					el.style.height = "0px";
					setTimeout(function(){
						document.querySelector(".fb_container div.loader").outerHTML = "";
					}, 500);
				}
			}, 100);
		}
	}
	var POSTS = {};
	var offset = 0;

	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) {
			return;
		}
		js = d.createElement(s);
		js.id = id;
		js.src = "//connect.facebook.net/ru_RU/sdk.js";
		fjs.parentNode.insertBefore(js, fjs);
	}(document, 'script', 'facebook-jssdk'));
	
	window.fbAsyncInit = function() {
		FB.init({
			appId: config.app_id,
			acces_token: config.access_token,
			xfbml: true,
			version: 'v2.8'
		});
		loadPage();
	};

	function loadPage(o){
		offset = o*1 || 0;
		loader.start();
		FB.api("/" + config.source + "/posts", {
			access_token: config.access_token,
			limit: 10,
			offset: offset,
			fields: ["created_time", "from", "message", "source", "attachments", "permalink_url"]
		}, handleResponse);
	}

	function handleResponse(response){
		if (!response || response.error){
			console.error("Error " + response.error.code + ":\n " + response.error.message);
			loader.stop();
			return false;
		}
		POSTS = response.data;
		
		var container = document.querySelector(".fb_container");
		for (var i = 0; i < POSTS.length; i++){
			var el = document.createElement("div");
			var t = POSTS[i];
			if (t.length() <= 5) continue;
			el.innerHTML = genCard({
				POST_ID: t.id,
				TIME: (function(timestamp){
					date = new Date(timestamp);
					return date.toLocaleString();
				})(t.created_time),
				
				ATTACHMENT: (function(t) {
					var c = "";
					if (!t.attachments || !t.attachments.data.length)return;
					for (var i = 0; i < t.attachments.data.length; i++) {
						var a = t.attachments.data[i];
						if (a.type == "share" || a.type == "quoted_share" || a.type == "image_share" || a.type.indexOf("video") == 0) {
							l = '<a href="{LINK}" target="_blank"><div class="link"><div class="bg{BLURRED}" style="{IMAGE}"></div><div class="bg-overlay"></div><div class="content">{CONTENT}</div></div></a>';
							l = l.replace("{LINK}", a.url);
							if (a.media && a.media.image && a.media.image.height > 50) {
								l = l.replace("{IMAGE}", 'background-image:url(' + a.media.image.src + ')');
								if(a.media.image.width < 410){
									l = l.replace("{BLURRED}", " blurred");
								}else{
									l = l.replace("{BLURRED}", "");
								}
							} else {
								l = l.replace("{IMAGE}", "");
								l = l.replace("{BLURRED}", "");
							}
							var content = "";
							if (a.title) {
								content += "<b>" + limitText(a.title, 200) + "</b>";
							} else if (a.description) {
								content += limitText(a.description, 100);
							}
							l = l.replace("{CONTENT}", content);
							c += l;
						}
					}
					return c;
				})(t),
				
				IMAGE: (function(t) {
					if (!t.attachments || !t.attachments.data.length)return;
					for (var i = 0; i < t.attachments.data.length; i++) {
						var a = t.attachments.data[i];
						if (a.type == "photo" || a.type == "profile_media" || a.type == "cover_photo") {
							return a.media.image.src;
						} else if (a.type == "album") {
							arr = [];
							for (var j = 0; j < a.subattachments.data.length; j++) {
								arr.push(a.subattachments.data[j].media.image.src);
							}
							return arr;
						}
					}
				})(t),
				
				TEXT: (function(t) {
					var out = "";
					if (t.message) {
						out += t.message;
					}
					out = limitText(out);
					out = out.linkify();
					out = out.replace(/(?:\r\n|\r|\n)/g, '<br />');
					//out += '<div class="quote"></div>';
					return out;
					})(t)
			});
			container.appendChild(el.firstChild);
		}
		var loadBtn = document.createElement("div");
		loadBtn.className = "loadBtn";
		loadBtn.innerHTML = "Load more";
		loadBtn.addEventListener("click", function(e){
			loadPage(offset + POSTS.length);
			e.target.outerHTML = "";
		});
		container.appendChild(loadBtn);
		loader.stop();
	}
	document.addEventListener("scroll", function(){
		el = document.querySelector(".fb_container div.loadBtn");
		if(!document.querySelector(".fb_container div.loadBtn"))return;
		var btnrect = el.getBoundingClientRect();
		if(window.innerHeight-btnrect.top > -200){
			loadPage(offset + POSTS.length);
			el.outerHTML = "";
		}
	});

	function genCard(data) {
		var tmpl = '<div class="card cw4" data-id="{POST_ID}"><div class="time">{TIME}</div>{IMAGES}{TEXT}{ATTACHMENT}</div></div>';
		var cout = tmpl;

		if (typeof data.IMAGE == "string") {
			cout = cout.replace("{IMAGES}", '<div class="images"><div class="image" style="background-image: url({IMAGE});"></div></div>');
		} else if (typeof data.IMAGE == "object") {
			imgs = '<div class="images">';
			for (var i = 0; i < data.IMAGE.length; i++) {
				imgs += ('<div class="image" style="background-image: url({IMAGE});"></div>').replace("{IMAGE}", data.IMAGE[i]);
			}
			imgs += '</div>';
			cout = cout.replace("{IMAGES}", imgs);
		}
		if (typeof data.TEXT == "string" && data.TEXT.length > 0) {
			cout = cout.replace("{TEXT}", '<div class="text">{TEXT}</div>');
		}
		if (typeof data.ATTACHMENT == "string" && data.ATTACHMENT.length > 0) {
			cout = cout.replace("{ATTACHMENT}", '<div class="attachment">{ATTACHMENT}</div>');
		}
		for (k in data) {
			cout = cout.replace("{" + k + "}", data[k]);
		}
		var others = ["{POST_ID}", "{PROFILE_PHOTO}", "{USERNAME}", "{TIME}", "{IMAGES}", "{TEXT}", "{IMAGE}"];
		for (var i = 0; i < others.length; i++) {
			cout = cout.replace(others[i], "");
		}
		cout = cout.split("undefined").join("");
		return cout;
	}

	function genPost(data) {
		var tmpl = '<div class="post"><div class="author"><div class="photo" style="background-image: url({PROFILE_PHOTO});"></div><div class="name">{USERNAME}</div><div class="time">{TIME}</div></div>{IMAGES}<div class="text">{TEXT}</div></div><div class="attachment">{ATTACHMENT}</div><a class="goto_source" href="http://vk.com/wall{ORIGINAL}">ƒивитись ориг≥нал</a><div id="img_view" style="display:none;"onclick="this.style.display=\'none\'"></div>';
		var cout = tmpl;

		if (typeof data.IMAGE == "string") {
			cout = cout.replace("{IMAGES}", '<div class="images"><div class="image" style="background-image: url({IMAGE});" onclick="var t = document.getElementById(\'img_view\');t.style.display=\'block\';t.style.backgroundImage=this.style.backgroundImage;"></div></div>');
		}
		for (k in data) {
			cout = cout.replace("{" + k + "}", data[k]);
		}
		var others = ["{POST_ID}", "{PROFILE_PHOTO}", "{USERNAME}", "{TIME}", "{IMAGES}", "{TEXT}", "{IMAGE}", "{ORIGINAL}", "{ATTACHMENT}"];
		for (var i = 0; i < others.length; i++) {
			cout = cout.replace(others[i], "");
		}
		return cout;
	}

	function limitText(str, limit) {
		limit = limit*1 || 500;
		if (str.indexOf(" ", limit) > -1) {
			r = str.substr(0, str.indexOf(" ", limit));
			return (r.length < str.length && r.length > limit) ? r + "..." : r
		} else {
			return str;
		}
	}
	!function(){"use strict";var t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol?"symbol":typeof t};!function(e){function n(t,e){var n=arguments.length<=2||void 0===arguments[2]?{}:arguments[2],o=Object.create(t.prototype);for(var a in n)o[a]=n[a];return o.constructor=e,e.prototype=o,e}function o(t){t=t||{},this.defaultProtocol=t.defaultProtocol||g.defaultProtocol,this.events=t.events||g.events,this.format=t.format||g.format,this.formatHref=t.formatHref||g.formatHref,this.nl2br=t.nl2br||g.nl2br,this.tagName=t.tagName||g.tagName,this.target=t.target||g.target,this.validate=t.validate||g.validate,this.ignoreTags=[],this.attributes=t.attributes||t.linkAttributes||g.attributes,this.className=t.className||t.linkClass||g.className;for(var e=t.ignoreTags||g.ignoreTags,n=0;n<e.length;n++)this.ignoreTags.push(e[n].toUpperCase())}function a(t,e){for(var n=0;n<t.length;n++)if(t[n]===e)return!0;return!1}function r(t){return t}function i(t,e){return"url"===e?"_blank":null}function s(){return function(t){this.j=[],this.T=t||null}}function c(t,e,n,o){for(var a=0,r=t.length,i=e,s=[],c=void 0;a<r&&(c=i.next(t[a]));)i=c,a++;if(a>=r)return[];for(;a<r-1;)c=new m(o),s.push(c),i.on(t[a],c),i=c,a++;return c=new m(n),s.push(c),i.on(t[r-1],c),s}function l(){return function(t){t&&(this.v=t)}}function u(t){var e=t?{v:t}:{};return n(b,l(),e)}function h(t){return t instanceof v||t instanceof P}var g={defaultProtocol:"http",events:null,format:r,formatHref:r,nl2br:!1,tagName:"a",target:i,validate:!0,ignoreTags:[],attributes:null,className:"linkified"};o.prototype={resolve:function(t){var e=t.toHref(this.defaultProtocol);return{formatted:this.get("format",t.toString(),t),formattedHref:this.get("formatHref",e,t),tagName:this.get("tagName",e,t),className:this.get("className",e,t),target:this.get("target",e,t),events:this.getObject("events",e,t),attributes:this.getObject("attributes",e,t)}},check:function(t){return this.get("validate",t.toString(),t)},get:function(e,n,o){var a=this[e];if(!a)return a;switch("undefined"==typeof a?"undefined":t(a)){case"function":return a(n,o.type);case"object":var r=a[o.type]||g[e];return"function"==typeof r?r(n,o.type):r}return a},getObject:function(t,e,n){var o=this[t];return"function"==typeof o?o(e,n.type):o}};var p=Object.freeze({defaults:g,Options:o,contains:a}),f=s();f.prototype={defaultTransition:!1,on:function(t,e){if(t instanceof Array){for(var n=0;n<t.length;n++)this.j.push([t[n],e]);return this}return this.j.push([t,e]),this},next:function(t){for(var e=0;e<this.j.length;e++){var n=this.j[e],o=n[0],a=n[1];if(this.test(t,o))return a}return this.defaultTransition},accepts:function(){return!!this.T},test:function(t,e){return t===e},emit:function(){return this.T}};var m=n(f,s(),{test:function(t,e){return t===e||e instanceof RegExp&&e.test(t)}}),d=n(f,s(),{jump:function(t){var e=arguments.length<=1||void 0===arguments[1]?null:arguments[1],n=this.next(new t(""));return n===this.defaultTransition?(n=new this.constructor(e),this.on(t,n)):e&&(n.T=e),n},test:function(t,e){return t instanceof e}}),b=l();b.prototype={toString:function(){return this.v+""}};var v=u(),y=u("@"),k=u(":"),w=u("."),j=u(),x=u(),z=u("\n"),O=u(),S=u("+"),N=u("#"),T=u(),E=u("?"),L=u("/"),A=u("_"),C=u(),P=u(),q=u(),R=u("{"),H=u("["),B=u("<"),U=u("("),K=u("}"),D=u("]"),M=u(">"),I=u(")"),_=Object.freeze({Base:b,DOMAIN:v,AT:y,COLON:k,DOT:w,PUNCTUATION:j,LOCALHOST:x,NL:z,NUM:O,PLUS:S,POUND:N,QUERY:E,PROTOCOL:T,SLASH:L,UNDERSCORE:A,SYM:C,TLD:P,WS:q,OPENBRACE:R,OPENBRACKET:H,OPENANGLEBRACKET:B,OPENPAREN:U,CLOSEBRACE:K,CLOSEBRACKET:D,CLOSEANGLEBRACKET:M,CLOSEPAREN:I}),G="aaa|aarp|abb|abbott|abogado|ac|academy|accenture|accountant|accountants|aco|active|actor|ad|adac|ads|adult|ae|aeg|aero|af|afl|ag|agency|ai|aig|airforce|airtel|al|alibaba|alipay|allfinanz|alsace|am|amica|amsterdam|an|analytics|android|ao|apartments|app|apple|aq|aquarelle|ar|aramco|archi|army|arpa|arte|as|asia|associates|at|attorney|au|auction|audi|audio|author|auto|autos|avianca|aw|ax|axa|az|azure|ba|baidu|band|bank|bar|barcelona|barclaycard|barclays|bargains|bauhaus|bayern|bb|bbc|bbva|bcg|bcn|bd|be|beats|beer|bentley|berlin|best|bet|bf|bg|bh|bharti|bi|bible|bid|bike|bing|bingo|bio|biz|bj|black|blackfriday|bloomberg|blue|bm|bms|bmw|bn|bnl|bnpparibas|bo|boats|boehringer|bom|bond|boo|book|boots|bosch|bostik|bot|boutique|br|bradesco|bridgestone|broadway|broker|brother|brussels|bs|bt|budapest|bugatti|build|builders|business|buy|buzz|bv|bw|by|bz|bzh|ca|cab|cafe|cal|call|camera|camp|cancerresearch|canon|capetown|capital|car|caravan|cards|care|career|careers|cars|cartier|casa|cash|casino|cat|catering|cba|cbn|cc|cd|ceb|center|ceo|cern|cf|cfa|cfd|cg|ch|chanel|channel|chase|chat|cheap|chloe|christmas|chrome|church|ci|cipriani|circle|cisco|citic|city|cityeats|ck|cl|claims|cleaning|click|clinic|clinique|clothing|cloud|club|clubmed|cm|cn|co|coach|codes|coffee|college|cologne|com|commbank|community|company|compare|computer|comsec|condos|construction|consulting|contact|contractors|cooking|cool|coop|corsica|country|coupon|coupons|courses|cr|credit|creditcard|creditunion|cricket|crown|crs|cruises|csc|cu|cuisinella|cv|cw|cx|cy|cymru|cyou|cz|dabur|dad|dance|date|dating|datsun|day|dclk|de|dealer|deals|degree|delivery|dell|deloitte|delta|democrat|dental|dentist|desi|design|dev|diamonds|diet|digital|direct|directory|discount|dj|dk|dm|dnp|do|docs|dog|doha|domains|download|drive|dubai|durban|dvag|dz|earth|eat|ec|edeka|edu|education|ee|eg|email|emerck|energy|engineer|engineering|enterprises|epson|equipment|er|erni|es|esq|estate|et|eu|eurovision|eus|events|everbank|exchange|expert|exposed|express|fage|fail|fairwinds|faith|family|fan|fans|farm|fashion|fast|feedback|ferrero|fi|film|final|finance|financial|firestone|firmdale|fish|fishing|fit|fitness|fj|fk|flickr|flights|florist|flowers|flsmidth|fly|fm|fo|foo|football|ford|forex|forsale|forum|foundation|fox|fr|fresenius|frl|frogans|frontier|fund|furniture|futbol|fyi|ga|gal|gallery|gallup|game|garden|gb|gbiz|gd|gdn|ge|gea|gent|genting|gf|gg|ggee|gh|gi|gift|gifts|gives|giving|gl|glass|gle|global|globo|gm|gmail|gmbh|gmo|gmx|gn|gold|goldpoint|golf|goo|goog|google|gop|got|gov|gp|gq|gr|grainger|graphics|gratis|green|gripe|group|gs|gt|gu|gucci|guge|guide|guitars|guru|gw|gy|hamburg|hangout|haus|hdfcbank|health|healthcare|help|helsinki|here|hermes|hiphop|hitachi|hiv|hk|hm|hn|hockey|holdings|holiday|homedepot|homes|honda|horse|host|hosting|hoteles|hotmail|house|how|hr|hsbc|ht|hu|hyundai|ibm|icbc|ice|icu|id|ie|ifm|iinet|il|im|immo|immobilien|in|industries|infiniti|info|ing|ink|institute|insurance|insure|int|international|investments|io|ipiranga|iq|ir|irish|is|iselect|ist|istanbul|it|itau|iwc|jaguar|java|jcb|je|jetzt|jewelry|jlc|jll|jm|jmp|jo|jobs|joburg|jot|joy|jp|jpmorgan|jprs|juegos|kaufen|kddi|ke|kerryhotels|kerrylogistics|kerryproperties|kfh|kg|kh|ki|kia|kim|kinder|kitchen|kiwi|km|kn|koeln|komatsu|kp|kpn|kr|krd|kred|kuokgroup|kw|ky|kyoto|kz|la|lacaixa|lamborghini|lamer|lancaster|land|landrover|lanxess|lasalle|lat|latrobe|law|lawyer|lb|lc|lds|lease|leclerc|legal|lexus|lgbt|li|liaison|lidl|life|lifeinsurance|lifestyle|lighting|like|limited|limo|lincoln|linde|link|live|living|lixil|lk|loan|loans|local|locus|lol|london|lotte|lotto|love|lr|ls|lt|ltd|ltda|lu|lupin|luxe|luxury|lv|ly|ma|madrid|maif|maison|makeup|man|management|mango|market|marketing|markets|marriott|mba|mc|md|me|med|media|meet|melbourne|meme|memorial|men|menu|meo|mg|mh|miami|microsoft|mil|mini|mk|ml|mm|mma|mn|mo|mobi|mobily|moda|moe|moi|mom|monash|money|montblanc|mormon|mortgage|moscow|motorcycles|mov|movie|movistar|mp|mq|mr|ms|mt|mtn|mtpc|mtr|mu|museum|mutuelle|mv|mw|mx|my|mz|na|nadex|nagoya|name|natura|navy|nc|ne|nec|net|netbank|network|neustar|new|news|nexus|nf|ng|ngo|nhk|ni|nico|nikon|ninja|nissan|nl|no|nokia|norton|nowruz|np|nr|nra|nrw|ntt|nu|nyc|nz|obi|office|okinawa|om|omega|one|ong|onl|online|ooo|oracle|orange|org|organic|origins|osaka|otsuka|ovh|pa|page|pamperedchef|panerai|paris|pars|partners|parts|party|passagens|pe|pet|pf|pg|ph|pharmacy|philips|photo|photography|photos|physio|piaget|pics|pictet|pictures|pid|pin|ping|pink|pizza|pk|pl|place|play|playstation|plumbing|plus|pm|pn|pohl|poker|porn|post|pr|praxi|press|pro|prod|productions|prof|promo|properties|property|protection|ps|pt|pub|pw|pwc|py|qa|qpon|quebec|quest|racing|re|read|realtor|realty|recipes|red|redstone|redumbrella|rehab|reise|reisen|reit|ren|rent|rentals|repair|report|republican|rest|restaurant|review|reviews|rexroth|rich|ricoh|rio|rip|ro|rocher|rocks|rodeo|room|rs|rsvp|ru|ruhr|run|rw|rwe|ryukyu|sa|saarland|safe|safety|sakura|sale|salon|samsung|sandvik|sandvikcoromant|sanofi|sap|sapo|sarl|sas|saxo|sb|sbs|sc|sca|scb|schaeffler|schmidt|scholarships|school|schule|schwarz|science|scor|scot|sd|se|seat|security|seek|select|sener|services|seven|sew|sex|sexy|sfr|sg|sh|sharp|shell|shia|shiksha|shoes|show|shriram|si|singles|site|sj|sk|ski|skin|sky|skype|sl|sm|smile|sn|sncf|so|soccer|social|softbank|software|sohu|solar|solutions|song|sony|soy|space|spiegel|spot|spreadbetting|sr|srl|st|stada|star|starhub|statefarm|statoil|stc|stcgroup|stockholm|storage|store|studio|study|style|su|sucks|supplies|supply|support|surf|surgery|suzuki|sv|swatch|swiss|sx|sy|sydney|symantec|systems|sz|tab|taipei|taobao|tatamotors|tatar|tattoo|tax|taxi|tc|tci|td|team|tech|technology|tel|telecity|telefonica|temasek|tennis|tf|tg|th|thd|theater|theatre|tickets|tienda|tiffany|tips|tires|tirol|tj|tk|tl|tm|tmall|tn|to|today|tokyo|tools|top|toray|toshiba|total|tours|town|toyota|toys|tp|tr|trade|trading|training|travel|travelers|travelersinsurance|trust|trv|tt|tube|tui|tunes|tushu|tv|tvs|tw|tz|ua|ubs|ug|uk|unicom|university|uno|uol|us|uy|uz|va|vacations|vana|vc|ve|vegas|ventures|verisign|versicherung|vet|vg|vi|viajes|video|viking|villas|vin|vip|virgin|vision|vista|vistaprint|viva|vlaanderen|vn|vodka|volkswagen|vote|voting|voto|voyage|vu|vuelos|wales|walter|wang|wanggou|watch|watches|weather|weatherchannel|webcam|weber|website|wed|wedding|weir|wf|whoswho|wien|wiki|williamhill|win|windows|wine|wme|wolterskluwer|work|works|world|ws|wtc|wtf|xbox|xerox|xin|xperia|xxx|xyz|yachts|yahoo|yamaxun|yandex|ye|yodobashi|yoga|yokohama|youtube|yt|za|zara|zero|zip|zm|zone|zuerich|zw".split("|"),Y="0123456789".split(""),Q="0123456789abcdefghijklmnopqrstuvwxyz".split(""),W=[" ","\f","\r","\t","\x0B"," ","?","?"],X=[],Z=function(t){return new m(t)},F=Z(),J=Z(O),V=Z(v),$=Z(),tt=Z(q);F.on("@",Z(y)).on(".",Z(w)).on("+",Z(S)).on("#",Z(N)).on("?",Z(E)).on("/",Z(L)).on("_",Z(A)).on(":",Z(k)).on("{",Z(R)).on("[",Z(H)).on("<",Z(B)).on("(",Z(U)).on("}",Z(K)).on("]",Z(D)).on(">",Z(M)).on(")",Z(I)).on([",",";","!",'"',"'"],Z(j)),F.on("\n",Z(z)).on(W,tt),tt.on(W,tt);for(var et=0;et<G.length;et++){var nt=c(G[et],F,P,v);X.push.apply(X,nt)}var ot=c("file",F,v,v),at=c("ftp",F,v,v),rt=c("http",F,v,v);X.push.apply(X,ot),X.push.apply(X,at),X.push.apply(X,rt);var it=ot.pop(),st=at.pop(),ct=rt.pop(),lt=Z(v),ut=Z(T);st.on("s",lt).on(":",ut),ct.on("s",lt).on(":",ut),X.push(lt),it.on(":",ut),lt.on(":",ut);var ht=c("localhost",F,x,v);X.push.apply(X,ht),F.on(Y,J),J.on("-",$).on(Y,J).on(Q,V),V.on("-",$).on(Q,V);for(var gt=0;gt<X.length;gt++)X[gt].on("-",$).on(Q,V);$.on("-",$).on(Y,V).on(Q,V),F.defaultTransition=Z(C);var pt=function(t){for(var e=t.replace(/[A-Z]/g,function(t){return t.toLowerCase()}),n=t.length,o=[],a=0;a<n;){for(var r=F,i=null,s=null,c=0,l=null,u=-1;a<n&&(s=r.next(e[a]));)i=null,r=s,r.accepts()?(u=0,l=r):u>=0&&u++,c++,a++;if(!(u<0)){a-=u,c-=u;var h=l.emit();o.push(new h(t.substr(a-c,c)))}}return o},ft=F,mt=Object.freeze({State:m,TOKENS:_,run:pt,start:ft}),dt=l();dt.prototype={type:"token",isLink:!1,toString:function(){for(var t=[],e=0;e<this.v.length;e++)t.push(this.v[e].toString());return t.join("")},toHref:function(){return this.toString()},toObject:function(){var t=arguments.length<=0||void 0===arguments[0]?"http":arguments[0];return{type:this.type,value:this.toString(),href:this.toHref(t)}}};var bt=n(dt,l(),{type:"email",isLink:!0,toHref:function(){return"mailto:"+this.toString()}}),vt=n(dt,l(),{type:"text"}),yt=n(dt,l(),{type:"nl"}),kt=n(dt,l(),{type:"url",isLink:!0,toHref:function(){for(var t=arguments.length<=0||void 0===arguments[0]?"http":arguments[0],e=!1,n=!1,o=this.v,a=[],r=0;o[r]instanceof T;)e=!0,a.push(o[r].toString().toLowerCase()),r++;for(;o[r]instanceof L;)n=!0,a.push(o[r].toString()),r++;for(;h(o[r]);)a.push(o[r].toString().toLowerCase()),r++;for(;r<o.length;r++)a.push(o[r].toString());return a=a.join(""),e||n||(a=t+"://"+a),a},hasProtocol:function(){return this.v[0]instanceof T}}),wt=Object.freeze({Base:dt,EMAIL:bt,NL:yt,TEXT:vt,URL:kt}),jt=function(t){return new d(t)},xt=jt(),zt=jt(),Ot=jt(),St=jt(),Nt=jt(),Tt=jt(),Et=jt(kt),Lt=jt(),At=jt(kt),Ct=jt(kt),Pt=jt(),qt=jt(),Rt=jt(),Ht=jt(),Bt=jt(),Ut=jt(kt),Kt=jt(kt),Dt=jt(kt),Mt=jt(kt),It=jt(),_t=jt(),Gt=jt(),Yt=jt(),Qt=jt(),Wt=jt(),Xt=jt(bt),Zt=jt(),Ft=jt(bt),Jt=jt(),Vt=jt(),$t=jt(),te=jt(yt);xt.on(z,te).on(T,zt).on(L,Ot),zt.on(L,Ot),Ot.on(L,St),xt.on(P,Nt).on(v,Nt).on(x,Et).on(O,Nt),St.on(P,Ct).on(v,Ct).on(O,Ct).on(x,Ct),Nt.on(w,Tt),Qt.on(w,Wt),Tt.on(P,Et).on(v,Nt).on(O,Nt).on(x,Nt),Wt.on(P,Xt).on(v,Qt).on(O,Qt).on(x,Qt),Et.on(w,Tt),Xt.on(w,Wt),Et.on(k,Lt).on(L,Ct),Lt.on(O,At),At.on(L,Ct),Xt.on(k,Zt),Zt.on(O,Ft);var ee=[v,y,x,O,S,N,T,L,P,A,C],ne=[k,w,E,j,K,D,M,I,R,H,B,U];Ct.on(R,qt).on(H,Rt).on(B,Ht).on(U,Bt),Pt.on(R,qt).on(H,Rt).on(B,Ht).on(U,Bt),qt.on(K,Ct),Rt.on(D,Ct),Ht.on(M,Ct),Bt.on(I,Ct),Ut.on(K,Ct),Kt.on(D,Ct),Dt.on(M,Ct),Mt.on(I,Ct),It.on(K,Ct),_t.on(D,Ct),Gt.on(M,Ct),Yt.on(I,Ct),qt.on(ee,Ut),Rt.on(ee,Kt),Ht.on(ee,Dt),Bt.on(ee,Mt),qt.on(ne,It),Rt.on(ne,_t),Ht.on(ne,Gt),Bt.on(ne,Yt),Ut.on(ee,Ut),Kt.on(ee,Kt),Dt.on(ee,Dt),Mt.on(ee,Mt),Ut.on(ne,Ut),Kt.on(ne,Kt),Dt.on(ne,Dt),Mt.on(ne,Mt),It.on(ee,Ut),_t.on(ee,Kt),Gt.on(ee,Dt),Yt.on(ee,Mt),It.on(ne,It),_t.on(ne,_t),Gt.on(ne,Gt),Yt.on(ne,Yt),Ct.on(ee,Ct),Pt.on(ee,Ct),Ct.on(ne,Pt),Pt.on(ne,Pt);var oe=[v,O,S,N,E,A,C,P];Nt.on(oe,Jt).on(y,Vt),Et.on(oe,Jt).on(y,Vt),Tt.on(oe,Jt),Jt.on(oe,Jt).on(y,Vt).on(w,$t),$t.on(oe,Jt),Vt.on(P,Qt).on(v,Qt).on(x,Xt);var ae=function(t){for(var e=t.length,n=0,o=[],a=[];n<e;){for(var r=xt,i=null,s=null,c=0,l=null,u=-1;n<e&&!(i=r.next(t[n]));)a.push(t[n++]);for(;n<e&&(s=i||r.next(t[n]));)i=null,r=s,r.accepts()?(u=0,l=r):u>=0&&u++,n++,c++;if(u<0)for(var h=n-c;h<n;h++)a.push(t[h]);else{a.length>0&&(o.push(new vt(a)),a=[]),n-=u,c-=u;var g=l.emit();o.push(new g(t.slice(n-c,n)))}}return a.length>0&&o.push(new vt(a)),o},re=Object.freeze({State:d,TOKENS:wt,run:ae,start:xt});Array.isArray||(Array.isArray=function(t){return"[object Array]"===Object.prototype.toString.call(t)});var ie=function(t){return ae(pt(t))},se=function(t){for(var e=arguments.length<=1||void 0===arguments[1]?null:arguments[1],n=ie(t),o=[],a=0;a<n.length;a++){var r=n[a];!r.isLink||e&&r.type!==e||o.push(r.toObject())}return o},ce=function(t){var e=arguments.length<=1||void 0===arguments[1]?null:arguments[1],n=ie(t);return 1===n.length&&n[0].isLink&&(!e||n[0].type===e)};e.find=se,e.inherits=n,e.options=p,e.parser=re,e.scanner=mt,e.test=ce,e.tokenize=ie}(window.linkify=window.linkify||{})}();
"use strict";!function(t,r){var n=function(t){function r(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function n(t){return t.replace(/"/g,"&quot;")}function e(t){if(!t)return"";var r=[];for(var e in t){var i=t[e]+"";r.push(e+'="'+n(i)+'"')}return r.join(" ")}function i(t){var i=arguments.length<=1||void 0===arguments[1]?{}:arguments[1];i=new u(i);for(var a=o(t),f=[],l=0;l<a.length;l++){var s=a[l];if("nl"===s.type&&i.nl2br)f.push("<br>\n");else if(s.isLink&&i.check(s)){var c=i.resolve(s),p=c.formatted,g=c.formattedHref,v=c.tagName,h=c.className,k=c.target,y=c.attributes,m="<"+v+' href="'+n(g)+'"';h&&(m+=' class="'+n(h)+'"'),k&&(m+=' target="'+n(k)+'"'),y&&(m+=" "+e(y)),m+=">"+r(p)+"</"+v+">",f.push(m)}else f.push(r(s.toString()))}return f.join("")}var o=t.tokenize,a=t.options,u=a.Options;return String.prototype.linkify||(String.prototype.linkify=function(t){return i(this,t)}),i}(r);t.linkifyStr=n}(window,linkify);
};