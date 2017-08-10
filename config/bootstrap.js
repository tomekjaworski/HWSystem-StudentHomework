/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */

module.exports.bootstrap = function (cb) {

    // It's very important to trigger this callback method when you are finished
    // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
    Users.count().exec(function countCB(error, found) {
        if(error) throw error;
        if(found===0){
            Roles.create([{
                name: 'admin'
            },{
                name: 'lecturer'
            },{
                name: 'student'
            }]).exec(function (err, finn){
                if (err) { throw err; }

                DeanGroups.create([{
                    name: 'Testowa',
                    desc: 'Grupa testowa 1',
                    owner: null
                },{
                    name: 'Testowa 2',
                    desc: 'Grupa testowa 2',
                    owner: null
                },{
                    name: 'Testowa 2',
                    desc: 'Grupa testowa 2',
                    owner: null
                }]).exec(function (err, finn){
                    if (err) { throw err; }

                    Subjects.create({
                        name: 'Podstawy Programowania',
                        desc: 'Podstawy podstaw'
                    }).exec(function (err, sub){
                        if (err) { throw err; }

                        Users.create([{
                            name: 'Test1',
                            surname: 'Tester1',
                            email: '1@p.lodz.pl',
                            password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                            salt: 'aaaa',
                            activated: true,
                            roles: [finn[0]]
                        },{
                            name: 'Test2',
                            surname: 'Tester2',
                            email: '2@p.lodz.pl',
                            password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                            salt: 'aaaa',
                            activated: true,
                            roles: [finn[1]]
                        },{
                            name: 'Test3',
                            surname: 'Tester3',
                            email: '3@p.lodz.pl',
                            password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                            salt: 'aaaa',
                            activated: true,
                            roles: [finn[2]]
                        },{
                            name: 'Test4',
                            surname: 'Tester4',
                            email: '4@p.lodz.pl',
                            password: 'a150f0e3b050a2d9907288d84eee05312eaa384eba3d5775688b4cba26e0af38',
                            salt: 'aaaa',
                            activated: true,
                            roles: [finn[2]]
                        }]).exec(function (err, finn){
                            if (err) { throw err; }

                            LabGroups.create([{
                                name: 'd3dx9_41',
                                subject: sub,
                                owner: finn[1],
                                time: '8:15 - 10:00',
                                date: 0,
                                students: [finn[2]]
                            },{
                                name: 'd3dx10_20',
                                subject: sub,
                                owner: finn[1],
                                time: '10:15 - 12:00',
                                date: 1,
                                students: [finn[3]]
                            },{
                                name: 'd3dx11',
                                subject: sub,
                                owner: finn[1],
                                time: '12:15 - 14:00',
                                date: 2
                            },{
                                name: 'd3dx2',
                                subject: sub,
                                owner: finn[1],
                                time: '14:15 - 16:00',
                                date: 3
                            }]).exec(function (err, finn){
                                if (err) { throw err; }

                                return cb();
                            });
                        });


                    });

                });


            });

        }
        else{
            cb();
        }
    });
};
