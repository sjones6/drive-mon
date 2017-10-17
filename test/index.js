const mongo = require('../index')
const {find, insert, update, remove} = mongo('localhost:27017', {
    eager: false,
    timeout: 500
});

insert("tester.insert1", [
    {
        a: 12
    }, {
        b: 22
    }
], {}, (err, res) => {
    console.log('a', {err, res})
})

insert("tester.insert1", [
    {
        cd: '12sdfa'
    }, {
        asdf: '22sadfa'
    }
], {}, (err, res) => {
    console.log('b',  {err, res})
})