import { expect } from 'chai';
import chaiHttp from 'chai-http';
import supertest from 'supertest';
import app from '../src/server.js'; // Adjust the path to your app

//const { expect } = chai; // Move this below the chai import

chai.use(chaiHttp);

describe('User Routes', () => {
  it('should have a test', (done) => {
    chai.request(app)
      .get('/')
      .end((err, res) => {
        expect(res).to.have.status(200);
        done();
      });
  });
});
