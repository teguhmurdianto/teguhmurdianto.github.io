(window.webpackJsonp=window.webpackJsonp||[]).push([[10],{"7pXE":function(e,t,a){"use strict";var n=a("ZXAI"),r=a("q1tI"),o=a.n(r),s=a("Wbzz"),l=a("3pSX"),i=a("zwU1"),c=a.n(i);t.a=function(e){var t=e.location;return o.a.createElement(s.StaticQuery,{query:"1986794767",render:function(e){var a=e.navItems,n=e.site,r=t.pathname===Object(s.withPrefix)("/"),i=n.siteMetadata;return o.a.createElement("nav",{className:"site-nav"},o.a.createElement("div",{className:"site-nav-left"},!r&&o.a.createElement(s.Link,{className:"site-nav-logo",to:"/"},o.a.createElement("img",{src:c.a,alt:i.title})),o.a.createElement("ul",{className:"nav",role:"menu"},a.edges.map((function(e,a){var n=e.node,r=Object(s.withPrefix)(n.slug)===t.pathname;return o.a.createElement("li",{className:r?"nav-current":"",key:a,role:"menuitem"},o.a.createElement(s.Link,{to:n.url},n.label))})))),o.a.createElement("div",{className:"site-nav-right"},o.a.createElement("div",{className:"social-links"},i.social.facebook&&o.a.createElement("a",{className:"social-link social-link-fb",target:"_blank",rel:"noopener noreferrer",href:"https://facebook.com/"+i.social.facebook},o.a.createElement(l.a.facebook,null)),i.social.twitter&&o.a.createElement("a",{className:"social-link social-link-tw",target:"_blank",rel:"noopener noreferrer",href:"https://twitter.com/"+i.social.twitter},o.a.createElement(l.a.twitter,null))),o.a.createElement("a",{className:"rss-button",target:"_blank",rel:"noopener noreferrer",href:"https://feedly.com/i/subscription/feed/"+i.siteUrl+"/rss.xml"},o.a.createElement(l.a.rss,null))))},data:n})}},MN1z:function(e,t,a){"use strict";a.r(t),a.d(t,"pageQuery",(function(){return c}));var n=a("q1tI"),r=a.n(n),o=a("qhky"),s=a("7oih"),l=a("lZQB"),i=a("7pXE");t.default=function(e){var t=e.pageContext,a=e.data,n=e.location,c=t.tag,m=a.allMarkdownRemark,u=m.edges,d=m.totalCount,p=a.site.siteMetadata.title;return r.a.createElement(s.a,{location:n},r.a.createElement(o.a,{title:"Posts tagged under "+c+" - "+p,bodyAttributes:{class:"tag-template"}}),r.a.createElement("header",{className:"site-header outer"},r.a.createElement("div",{className:"inner"},r.a.createElement(i.a,{location:n}),r.a.createElement("div",{className:"site-header-content"},r.a.createElement("h1",{className:"site-title"},c),r.a.createElement("h2",{className:"site-description"},c.description||"A collection of "+d+" post"+(d>1?"s":""))))),r.a.createElement(l.a,{posts:u,postsPerPage:10}))};var c="4072439189"},ZXAI:function(e){e.exports=JSON.parse('{"data":{"navItems":{"edges":[{"node":{"label":"Home","url":"/"}},{"node":{"label":"General","url":"/tag/general"}}]},"site":{"siteMetadata":{"title":"tmurdianto","siteUrl":"https://tmurdianto.com","social":{"facebook":"murdiantoteguh","twitter":"teguh_murdianto"}}}}}')},lZQB:function(e,t,a){"use strict";a.d(t,"a",(function(){return s}));var n=a("q1tI"),r=a.n(n),o=a("SfDe");var s=function(e){var t,a;function n(t){var a;return(a=e.call(this,t)||this).handleScroll=function(){a.ticking||(a.ticking=!0,requestAnimationFrame((function(){return a.update()})))},a.update=function(){document.documentElement.offsetHeight-(window.scrollY+window.innerHeight)<100&&a.setState({postsToShow:a.state.postsToShow+a.props.postsPerPage},(function(){a.state.postsToShow>=a.maxPages&&window.removeEventListener("scroll",a.handleScroll)})),a.ticking=!1},a.state={postsToShow:t.postsPerPage},a.maxPages=t.posts.length,a.ticking=!1,a}a=e,(t=n).prototype=Object.create(a.prototype),t.prototype.constructor=t,t.__proto__=a;var s=n.prototype;return s.componentDidMount=function(){window.addEventListener("scroll",this.handleScroll)},s.componentWillUnmount=function(){window.removeEventListener("scroll",this.handleScroll)},s.render=function(){var e=this.props.posts;return r.a.createElement("main",{id:"site-main",className:"site-main outer"},r.a.createElement("div",{className:"inner"},r.a.createElement("div",{className:"post-feed"},e.slice(0,this.state.postsToShow).map((function(e,t){return r.a.createElement(o.a,{key:t,post:e.node})})))))},n}(r.a.Component)}}]);
//# sourceMappingURL=component---src-templates-tags-js-e89aaee2b461c3e0827e.js.map