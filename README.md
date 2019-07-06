# Venus
  曾经我尝试做一个类似~~钉钉~~的开源产品。但是在找投资的时候，被告知类似的产品很多,产品并没有太多的意义。所以它在硬盘里又躺了快1年吧，最后我想还是放出来吧。

  这是一款IM 产品，它以网页版的形式提供服务，支持手机端 PC端。它的功能包括 直接语音留言， 视频聊天，音频聊天，文字聊天，加好友等基本功能。没错，是利用网页直接进行视频聊天，语音聊天。在webrtc 如此使用广泛的情况下，做到这点很容易。

   说说效果，在局域网里，比如在公司内部，我觉得你可以获得不亚于QQ 微信的使用体验。视频聊天都会非常正常，效果也不错。如果是互联网上，你文字和语音留言都不成问题，如果要视频，你需要专门提供一个stun服务器才有可能。stun的速度决定了你的效果。坦白地说，利用网页形式 直接进行视频聊天的条件并不成熟。但是5G时代，我相信这样的应用会更加容易实现 

我搭建了一个演示网站，可以直接使用

https://www.meetyoucn.com

![网站首页](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/meetyou.png)



  效果大概这样！

![Watch the video](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/Video.jpg)](http://www.iqiyi.com/w_19s8wf4dp5.html)



部署

1. 如果 我在Internet 上部署，我需要做什么？

   首先你需要准备SSL证书。然后将证书分别改名为cert.pem 和 key.pem。覆盖项目里原有的证书。

   其次，你需要安装一个redis 服务器作为数据库。

   下载完源码： 在本地看大概这样

   ![Image text](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/5.png)

   ​

   代码的位置在  /webroot/html/js/domain.js

   修改代码里的配置 

   ![修改代码](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/6.png)   

     然后分别重新启动 程序即可。 注意 启动离线语音消息服务器的时候，需要 修改域名部分。 

   启动的样子大概这样，

   启动网站

    ![运行网站](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/1.png)

   启动 信令服务器

   ![运行信令](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/2.png)

   启动IM服务器 这个需要指定redis服务器的地址

      ![运行IM](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/3.png)

   启动离线语音消息服务器， 注意 这个需要指定完整的域名

   ![运行离线语言](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/4-1.png)

   ​    比如你的域名是 www.aaa.com   那么你启动离线语音消息服务器的命令就是

      ./upload -hostname=https://www.aaa.com

      注意必须是https://www.aaa.com  不是http://www.aaa.com

      注意 在Internet 上进行视频通信，需要安装stun,否则视频大概率是会失败的。

      比如你和对方在不同地方使用手机，服务器在Internet上，直接文字聊天，语音留言都没有问题，但是你们直接视频聊天大概率会失败。

     如果你和对方在同一局域网内，使用的服务器在Internet上，那么无论文字聊天，语音留言，直接视频是没有问题的。

   ​

2. 如果我有自己的域名和证书， 我想在局域网里部署，我需要做什么？

   同Internet 部署，没有任何区别

3. 如果你没有自己域名和证书，但是也想试试局域网部署。

   首先，确认你会安装服务器程序的IP, 如果 它们的Ip 是如下IP 里的一个，那么你可以用这个程序直接安装。

   ![Image text](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/dns.png)

​       比如我想安装到的服务地址是 192.168.0.1  那么我可以用www01.meetyoucn.com 作为你的局域网里的域名。

​       第一步 修改源码

​      代码的位置在  /webroot/html/js/domain.js

修改代码里的配置 

![修改代码](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/6.png)   

​      将域名修改成  www01.meetyoucn.com



然后分别重新启动 程序即可。 注意 启动离线语音消息服务器的时候，需要 修改域名部分。 

启动的样子大概这样，

启动网站

 ![运行网站](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/1.png)

启动 语音聊天的信令服务器

![运行信令](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/2.png)

启动IM服务器 这个需要指定redis服务器的地址

   ![运行IM](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/3.png)

启动离线语音消息服务器， 注意 这个需要指定完整的域名

启动命令将改成 ./upload -hostname=https://www01.meetyoucn.com

![运行离线语音](https://raw.githubusercontent.com/xiaojiaqi/Venus/master/manual/4-1.png)

然后你使用 电脑 手机 ipad 打开  https://www01.meetyoucn.com  就可以注册，运行产品了。



浏览器版本要求

|             | 文字聊天  | 视频聊天            | 操作系统 |
| :---------: | ----- | --------------- | ---- |
|     PC      | 所有浏览器 | Firefox, Chrome | 无要求  |
| Ipad/Iphone | 所有浏览器 | Safari          | 12.0 |
|   Android   | 所有浏览器 | Chrome          | 无要求  |



服务器一共有5个。我发现虽然开源过代码，但是我发现大家并没什么兴趣，看来一个可用的产品才是最重要了。

-    第一个 是 网页部分，这个部分是基于一个Layim的产品构建的。我已经购买了源码，你可以放心在上面继续开源使用。  
-    第二个 是一个Web服务器， 这个你完全可以用一个nginx服务代理。   
-    第三个 是语音留言服务器， 当你进行语音留言的时候，它会帮你将数据存储在web服务器上。 
-    第四个 是信令服务器，  主要用于视频聊天时管理双方的信令交互。  
-    第五个 是IM服务器，主要负责好友关系处理，聊天这样的服务。 



源码的话，看大家反应吧，如果星多就逐步发布吧。

有任何问题 都可以邮件  xiaojiaqi.cn#gmail.com
