module.exports = {
  hooks: {
    readPackage(pkg) {
      // 可以在这里修改包的行为
      return pkg;
    }
  }
};