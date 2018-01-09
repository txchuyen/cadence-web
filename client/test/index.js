if (module.hot) {
  module.hot.addStatusHandler(function(status) {
    if (status === 'apply') {
      location.reload()
    }
  })
}

require('mocha/mocha')

var mochaDiv = document.createElement('div')
mochaDiv.id = 'mocha'
document.body.appendChild(mochaDiv)
document.querySelector('[rel="stylesheet"]').href="https://cdnjs.cloudflare.com/ajax/libs/mocha/3.4.2/mocha.css"
document.title = 'Cadence Tests'

var chai = window.chai = require('chai')
chai.should()
chai.use(require('chai-dom'))

require('nathanboktae-browser-test-utils')

mocha.setup({
  ui: 'bdd',
  globals: ['Scenario', 'testEl'],
  slow: 500
})

beforeEach(function() {
  localStorage.clear()
})

// hack workaround for https://github.com/mochajs/mocha/issues/1635
var oldIt = window.it
window.it = function(name, func) {
  if (func) {
    var origFunc = func

    var wrapperFunc = function() {
      var result = func.call(this)
      if (result && typeof result.then === 'function') {
        var currScenario = this.test.scenario
        return result.then(
          () => currScenario && currScenario.tearDown(),
          e => currScenario ? currScenario.tearDown().then(() => Promise.reject(e), () => Promise.reject(e)) : Promise.reject(e)
        )
      } else {
        return scenario && scenario.tearDown().then(() => result)
      }
    }
    wrapperFunc.toString = origFunc.toString.bind(origFunc)

    return oldIt(name, wrapperFunc)
  } else {
    return oldIt.apply(null, arguments)
  }
}

HTMLInputElement.prototype.input = function(text) {
  this.value = text
  this.trigger('input', { testTarget: this })
}

HTMLElement.prototype.selectItem = async function(text) {
  var openDropdown = new MouseEvent('mousedown')
  this.querySelector('.dropdown-toggle').dispatchEvent(openDropdown)

  var itemToClick = Array.from(await this.waitUntilAllExist('ul.dropdown-menu li a')).find(a => a.innerText.trim() === text),
      selectItem = new MouseEvent('mousedown')

  itemToClick.dispatchEvent(selectItem)
}

require('./scenario')

mocha.checkLeaks()

require('./intro.test')
require('./workflows.test')

mocha.run()