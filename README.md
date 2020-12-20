# ituring-fetcher

获取 [图灵已购书籍](https://www.ituring.com.cn/user/shelf) 将每本书的多个章节整合为单个 `html` 文件。

配合 [ituring-reader](https://github.com/imoutodonuts/ituring-reader) 使用。

## Install

```sh
git clone https://github.com/imoutodonuts/ituring-fetcher.git
cd ituring-fetcher
npm install
```

## Usage

登录图灵社区官网后打开 **开发者工具**，点击 **应用程序(chrome)/存储空间(safari) -> Cookie**
复制 `.AspNet.ApplicationCookie` 的值作为 `npm run fetch` 命令的参数。

```sh
npm run fetch <cookie>
```
