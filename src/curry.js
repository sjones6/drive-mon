module.exports = oFn => (...xs) => xs.reduce((fn, v) => fn(v), oFn)
