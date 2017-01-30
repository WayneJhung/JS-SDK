import '../helpers/global'
import sandbox from '../helpers/sandbox'
import Backendless from '../../../src/backendless'

function Foo() {
}

const users = {
  john  : {
    email   : 'john@lennon.co',
    name    : 'John Lennon',
    password: 'beatlesforever'
  },
  paul  : {
    email   : 'paul@mccartney.co',
    name    : 'Paul Mccartney',
    password: 'beatlesforever'
  },
  george: {
    email   : 'george@harrison.co',
    name    : 'George Harrison',
    password: 'beatlesforever'
  }
}

describe('Backendless.Persistence', function() {
  describe('Persistence', function() {
    let consoleApi
    let appId
    let Persistence

    const insertRecord = (tableName, record) =>
      consoleApi.tables.createRecord(appId, { name: tableName }, record)

    const insertUsers = () =>
      Promise.resolve()
        .then(() => insertRecord('Users', users.john))
        .then(() => insertRecord('Users', users.paul))
        .then(() => insertRecord('Users', users.george))

    const createBigTable = () => {
      const paginationTestData = [...Array(100).keys()].map(i => ({ counter: i + 1, name: 'John ' + i + 1 }))

      return Promise.resolve()
        .then(() => insertRecord('TableWithPagination', { counter: 0, name: 'Initial' }))
        .then(() => Promise.all(paginationTestData.map(record => insertRecord('TableWithPagination', record))))
    }

    sandbox.forTest()

    beforeEach(function() {
      consoleApi = this.consoleApi
      appId = this.app.id
      Persistence = Backendless.Persistence
    })

    it('Create new table', function() {
      const entity = new Foo()
      entity.firstName = 'First'
      entity.lastName = 'Last'

      return Persistence.of(Foo).save(entity).then(result => {
        expect(result).to.be.instanceof(Foo)
        expect(result.objectId).to.be.a('string')
        expect(result.firstName).to.be.equal(entity.firstName)
        expect(result.lastName).to.be.equal(entity.lastName)
      })
    })

    it('Update record', function() {
      const entity = new Foo()
      entity.firstName = 'Bill'
      entity.lastName = 'Gates'

      const db = Persistence.of(Foo)

      return db.save(entity)
        .then(() => entity.firstName = 'Ron')
        .then(() => db.save(entity))
        .then(updated => {
          expect(updated.firstName).to.be.equal(entity.firstName)
          expect(updated.lastName).to.be.equal(entity.lastName)
        })
    })

    it('Remove record', function() {
      const db = Persistence.of('TableToTestDeletion')
      let toRemove

      return Promise.resolve()
        .then(() => insertRecord('TableToTestDeletion', { evil: 'Justin Bieber' })) // let destroy the evil
        .then(() => db.findFirst())
        .then(result => {
          toRemove = result

          return db.remove(result.objectId)
        })
        .then(() => db.findById(toRemove.objectId))
        .catch(error => {
          expect(error.message).to.be.equal(`Entity with name ${toRemove.objectId} cannot be found`)
        })
        .then(() => db.find())
        .then(result => {
          expect(result.length).to.be.equal(0) // the world is saved
        })
    })

    it('Add record to Users table', function() {
      const db = Persistence.of(Backendless.User)

      const user = {
        email   : 'ringo@starr.co',
        name    : 'Ringo Starr',
        password: 'beatlesforever'
      }

      return Promise.resolve()
        .then(insertUsers)
        .then(() => db.save(user))
        .then(result => {
          expect(result).to.be.an.instanceof(Backendless.User)
          expect(result).to.have.property('email').that.equal(user.email)
          expect(result).to.have.property('name').that.equal(user.name)
          expect(result).to.not.have.property('password')
        })
    })

    it('Impossible to get persistence of Users using string signature', function() {
      const db = () => Persistence.of('Users')

      const expectedError = "Table 'Users' is not accessible through this signature. " +
        "Use Backendless.Data.of( Backendless.User ) instead"

      expect(db).to.throw(expectedError)
    })

    it('Check instance of objects from Users table', function() {
      const db = Persistence.of(Backendless.User)

      return Promise.resolve()
        .then(insertUsers)
        .then(() => db.find())
        .then(result => {
          result.forEach(object => expect(object).to.be.an.instanceof(Backendless.User))
        })
    })

    it('Update table record with invalid data type for properties', function() {
      const db = Persistence.of('Blackstar')

      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => db.findFirst())
        .then(result => {
          result.integerCol = 'String value' // column type is Number
          result.boolCol = 'String value' // column type is Boolean

          return result
        })
        .then(result => db.save(result))
        .catch(error => {
          expect(error.message).to.match(/Unable to save object - invalid data type for properties/)
        })
    })

    it('Remove object with wrong type of objectId', function() {
      const db = Persistence.of('Blackstar')
      const expectedError = 'Invalid value for the "value" argument. ' +
        'The argument must contain only string or object values'

      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => db.remove(9999)) // remove expect only string parameter
        .catch(error => expect(error.message).to.be.equal(expectedError))
    })

    it('Save object with Backendless.Persistence.save() notation', function() {
      const record = {
        name : 'David',
        email: 'david@bowie.co.ua'
      }

      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => Persistence.save('Blackstar', record))
        .then(result => {
          expect(result.name).to.be.equal(record.name)
          expect(result.email).to.be.equal(record.email)
          expect(result.___class).to.be.equal('Blackstar')
        })
    })

    it('Save object with boolean property', function() {
      const db = Persistence.of('Blackstar')
      const record = {
        boolCol: true
      }

      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => db.save(record))
        .then(result => {
          expect(result.boolCol).to.be.a('boolean')
          expect(result.boolCol).to.be.true
        })
    })

    it('Save object with int property', function() {
      const db = Persistence.of('Blackstar')
      const record = {
        integerCol: 42
      }

      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => db.save(record))
        .then(result => {
          expect(result.integerCol).to.be.a('number')
          expect(result.integerCol).to.be.equal(record.integerCol)
        })
    })

    it('Save object with double property', function() {
      const db = Persistence.of('Blackstar')
      const record = {
        doubleCol: Math.random() * 10
      }

      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => db.save(record))
        .then(result => {
          expect(result.doubleCol).to.be.a('number')
          expect(result.doubleCol).to.be.equal(record.doubleCol)
        })
    })

    it('Save object with String property', function() {
      const db = Persistence.of('Blackstar')
      const record = {
        stringCol: 'string value'
      }

      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => db.save(record))
        .then(result => {
          expect(result.stringCol).to.be.a('string')
          expect(result.stringCol).to.be.equal(record.stringCol)
        })
    })

    it('Find Record By objectId', function() {
      let entity = new Foo()
      entity.firstName = 'Bill'
      entity.lastName = 'Gates'

      const db = Persistence.of(Foo)

      return db.save(entity)
        .then(result => entity = result)
        .then(() => db.findById(entity.objectId))
        .then(serverEntity => {
          expect(serverEntity.objectId).to.be.equal(entity.objectId)
          expect(serverEntity.firstName).to.be.equal(entity.firstName)
          expect(serverEntity.lastName).to.be.equal(entity.lastName)
        })
    })

    it('Find Record By Non Existing objectId', function() {
      const db = Persistence.of('Blackstar')

      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => db.findById('NonExistingObjectId'))
        .catch(error => {
          expect(error.message).to.be.equal('Entity with name NonExistingObjectId cannot be found')
        })
    })

    it('Find with Where clause', function() {
      const db = Persistence.of(Backendless.User)
      const query = Backendless.DataQueryBuilder.create().setWhereClause('name like \'%Lennon%\'')

      return Promise.resolve()
        .then(insertUsers)
        .then(() => db.find(query))
        .then(result => {
          expect(result.length).to.be.equal(1)
          expect(result[0].name).to.match(/Lennon/)
        })
    })

    it('Find with properties', function() {
      const db = Persistence.of('TableWithPagination')
      const query = Backendless.DataQueryBuilder.create().setProperties(['name'])

      return Promise.resolve()
        .then(createBigTable)
        .then(() => db.find(query))
        .then(result => {
          expect(result[0]).to.not.have.property('counter')
          expect(result[0]).to.have.property('name')
        })
    })

    it('Find with non existing properties', function() {
      const db = Persistence.of('TableWithPagination')
      const query = Backendless.DataQueryBuilder.create().setProperties(['nonExistingProp']) //.setSortBy('counter').setPageSize(50)

      return Promise.resolve()
        .then(createBigTable)
        .then(() => db.find(query))
        .catch(error => {
          expect(error.message).to.be.equal('Unable to retrieve data. Query contains invalid object properties.')
        })
    })

    it('Find first/last on empty table', function() {
      const db = Persistence.of('EmptyTable')

      return Promise.resolve()
        .then(() => db.findFirst())
        .catch(error => {
          expect(error.code).to.be.equal(1009)
        })
    })

    it('Find with offset greater than the max number of records', function() {
      const db = Persistence.of('TableWithPagination')
      const query = Backendless.DataQueryBuilder.create().setOffset(500)

      return Promise.resolve()
        .then(createBigTable)
        .then(() => db.find(query))
        .then(result => {
          expect(result).to.be.an('Array')
          expect(result.length).to.be.equal(0)
        })
    })

    it('Retrieves Properties of table', function() {
      return Promise.resolve()
        .then(() => insertRecord('Blackstar', { integerCol: 1, boolCol: false }))
        .then(() => Persistence.describe('Blackstar'))
        .then(schema => {
          schema.forEach(schemaObject => expect(schemaObject).to.have.all.keys([
            'name', 'required', 'type', 'defaultValue', 'relatedTable', 'customRegex', 'autoLoad', 'isPrimaryKey'
          ]))
        })
    })

    it('Retrieves Properties of non existing table', function() {
      return expect(Persistence.describe('NonExistingTable'))
        .to.eventually.be.rejected
        .and.eventually.to.have.property('code', 1009)
    })

    it('Sort by', function() {
      const db = Persistence.of('TableWithPagination')
      const query = Backendless.DataQueryBuilder.create().setSortBy('counter').setPageSize(100)

      return Promise.resolve()
        .then(createBigTable)
        .then(() => db.find(query))
        .then(result => {
          expect(result).to.have.lengthOf(100)
          result.forEach((record, idx) => {
            expect(result[idx]).to.have.property('counter').that.equal(idx)
          })
        })
    })

    it('Retrieve object count', function() {
      const db = Persistence.of('TableWithPagination')
      const whereClause = Backendless.DataQueryBuilder.create().setWhereClause('counter < 50')

      return Promise.resolve()
        .then(createBigTable)
        .then(() => db.getObjectCount())
        .then(count => expect(count).to.be.equal(101))
        .then(() => db.getObjectCount(whereClause))
        .then(count => expect(count).to.be.equal(50))
    })

    it('Retrieving nextPage', function() {
      const db = Persistence.of('TableWithPagination')
      const query = Backendless.DataQueryBuilder.create().setSortBy('counter')

      return Promise.resolve()
        .then(createBigTable)
        .then(() => db.find(query))
        .then(result => {
          expect(result).to.have.lengthOf(10)
          expect(result[9]).to.have.property('counter').that.equal(9)
        })
        .then(() => query.prepareNextPage())
        .then(() => db.find(query))
        .then(result => {
          expect(result).to.have.lengthOf(10)
          expect(result[9]).to.have.property('counter').that.equal(19)
        })
    })

    it('Set relations', function() {
      const joeThePlumber = {
        name    : 'Joe',
        age     : 27,
        phone   : '1-972-5551212',
        title   : 'Plumber',
        ___class: 'Contact'
      }

      const address = {
        street  : '123 Main St.',
        city    : 'Denver',
        state   : 'Colorado',
        ___class: 'Address'
      }

      const contactStore = Persistence.of('Contact')
      const addressStore = Persistence.of('Address')

      Promise.all([
        contactStore.save(joeThePlumber),
        addressStore.save(address)
      ])
        .then(([savedContact, savedAddress]) =>
          contactStore.setRelation(savedContact, 'address', [savedAddress]))
        .then(result => {
          console.log(result)
        })
    })
  })

  /****************
   * PERMISSIONS  *
   ****************/

  describe('Permissions', function() {
    sandbox.forTest()

    const roleName = 'AuthenticatedUser'
    let Permissions
    let user

    beforeEach(function() {
      Permissions = Backendless.Data.Permissions

      const db = Backendless.Persistence.of(Backendless.User)

      return Promise.resolve()
        .then(() => this.consoleApi.tables.createRecord(this.app.id, { name: 'Users' }, users.john))
        .then(() => db.findFirst())
        .then(result => user = result)
    })

    describe('FIND', function() {

      describe('GRANT', function() {

        it('user', function() {
          return Permissions.FIND.grantUser(user.objectId, user)
        })

        it('role', function() {
          return Permissions.FIND.grantRole(roleName, user)
        })

        it('all users', function() {
          return Permissions.FIND.grant(user)
        })
      })

      describe('DENY', function() {

        it('user', function() {
          return Permissions.FIND.denyUser(user.objectId, user)
        })

        it('role', function() {
          return Permissions.FIND.denyRole(roleName, user)
        })

        it('all users', function() {
          return Permissions.FIND.deny(user)
        })
      })
    })

    describe('REMOVE', function() {

      describe('GRANT', function() {

        it('user', function() {
          return Permissions.REMOVE.grantUser(user.objectId, user)
        })

        it('role', function() {
          return Permissions.REMOVE.grantRole(roleName, user)
        })

        it('all users', function() {
          return Permissions.REMOVE.grant(user)
        })
      })

      describe('DENY', function() {

        it('user', function() {
          return Permissions.REMOVE.denyUser(user.objectId, user)
        })

        it('role', function() {
          return Permissions.REMOVE.denyRole(roleName, user)
        })

        it('all users', function() {
          return Permissions.REMOVE.deny(user)
        })
      })
    })

    describe('UPDATE', function() {

      describe('GRANT', function() {

        it('user', function() {
          return Permissions.UPDATE.grantUser(user.objectId, user)
        })

        it('role', function() {
          return Permissions.UPDATE.grantRole(roleName, user)
        })

        it('all users', function() {
          return Permissions.UPDATE.grant(user)
        })
      })

      describe('DENY', function() {

        it('user', function() {
          return Permissions.UPDATE.denyUser(user.objectId, user)
        })

        it('role', function() {
          return Permissions.UPDATE.denyRole(roleName, user)
        })

        it('all users', function() {
          return Permissions.UPDATE.deny(user)
        })
      })
    })
  })
})
