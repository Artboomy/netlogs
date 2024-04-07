import React, { FC, useState } from 'react';

import { InspectorWrapper as Component } from '../InspectorWrapper';
import { SearchContext } from 'react-inspector';

export default {
    title: 'InspectorWrapper',
    component: Component
};

const testData = [
    {
        _id: '604b24b4dc39796e29408159',
        index: 0,
        guid: 'bff1ada3-3691-404d-939b-5e577f34595b',
        isActive: false,
        balance: '$2,840.38',
        picture: 'http://placehold.it/32x32',
        age: 21,
        eyeColor: 'blue',
        name: 'Mathews Kent',
        gender: 'male',
        company: 'ISODRIVE',
        email: 'mathewskent@isodrive.com',
        phone: '+1 (929) 580-3410',
        address: '498 Clinton Avenue, Kenmar, Arizona, 9382',
        about: 'Adipisicing occaecat cupidatat proident irure dolor in minim deserunt nulla in voluptate tempor id. Ipsum consequat esse laborum enim proident duis cillum minim sint Lorem ex aliqua est ipsum. Eu laborum voluptate sunt elit Lorem magna.\r\n',
        registered: '2014-09-26T06:31:13 -05:00',
        latitude: -66.49167,
        longitude: 118.593118,
        tags: ['esse', 'in', 'ut', 'deserunt', 'est', 'nisi', 'sit'],
        friends: [
            {
                id: 0,
                name: 'Diana Edwards'
            },
            {
                id: 1,
                name: 'Sherry Macdonald'
            },
            {
                id: 2,
                name: 'Verna Beard'
            }
        ],
        greeting: 'Hello, Mathews Kent! You have 3 unread messages.',
        favoriteFruit: 'apple'
    },
    {
        _id: '604b24b434135fb164cfdfe6',
        index: 1,
        guid: '4cd4f316-c36e-44df-9002-ad5ca1c86ffb',
        isActive: true,
        balance: '$2,922.10',
        picture: 'http://placehold.it/32x32',
        age: 35,
        eyeColor: 'green',
        name: 'Karyn Decker',
        gender: 'female',
        company: 'PURIA',
        email: 'karyndecker@puria.com',
        phone: '+1 (914) 596-3944',
        address: '648 Argyle Road, Bridgetown, Alaska, 131',
        about: 'Pariatur excepteur non dolor pariatur. Nostrud enim commodo sit fugiat dolor Lorem ut id magna ipsum consequat mollit duis qui. Commodo sit proident amet ad. Quis commodo dolore qui consectetur sit et. Excepteur et tempor laborum nulla exercitation cupidatat incididunt reprehenderit deserunt dolor ipsum proident. Tempor reprehenderit tempor voluptate eu occaecat incididunt aute ex voluptate amet. Nostrud aliqua tempor non sunt.\r\n',
        registered: '2020-12-25T03:45:19 -05:00',
        latitude: 70.908358,
        longitude: 43.822339,
        tags: [
            'aliquip',
            'nulla',
            'nisi',
            'ea',
            'proident',
            'adipisicing',
            'nisi'
        ],
        friends: [
            {
                id: 0,
                name: 'Dunlap Barron'
            },
            {
                id: 1,
                name: 'Debora Hendrix'
            },
            {
                id: 2,
                name: 'Marci Griffin'
            }
        ],
        greeting: 'Hello, Karyn Decker! You have 4 unread messages.',
        favoriteFruit: 'strawberry'
    },
    {
        _id: '604b24b4e8917cd6d920ce3f',
        index: 2,
        guid: '8d7894c3-5a52-4071-a3d9-e835d9de79e0',
        isActive: false,
        balance: '$1,815.06',
        picture: 'http://placehold.it/32x32',
        age: 28,
        eyeColor: 'blue',
        name: 'Lizzie Mccarthy',
        gender: 'female',
        company: 'ZORK',
        email: 'lizziemccarthy@zork.com',
        phone: '+1 (841) 497-2473',
        address: '386 Cropsey Avenue, Floris, Hawaii, 8465',
        about: 'Eu sit pariatur consectetur elit laborum aliquip consequat duis fugiat. Adipisicing amet incididunt qui do ipsum proident amet eu exercitation nostrud. Tempor tempor nisi aliquip tempor quis adipisicing esse minim et. Veniam qui aliqua amet exercitation excepteur duis veniam ea ipsum ullamco non in veniam culpa.\r\n',
        registered: '2014-06-22T10:47:11 -05:00',
        latitude: 10.451489,
        longitude: 78.409222,
        tags: [
            'exercitation',
            'aliqua',
            'incididunt',
            'sunt',
            'esse',
            'sunt',
            'ipsum'
        ],
        friends: [
            {
                id: 0,
                name: 'Edith Duncan'
            },
            {
                id: 1,
                name: 'Michael Roth'
            },
            {
                id: 2,
                name: 'Lowery Faulkner'
            }
        ],
        greeting: 'Hello, Lizzie Mccarthy! You have 2 unread messages.',
        favoriteFruit: 'apple'
    },
    {
        _id: '604b24b4e9247c94a765aedf',
        index: 3,
        guid: '350cade3-079c-4675-8a28-c16525740ad4',
        isActive: false,
        balance: '$2,975.39',
        picture: 'http://placehold.it/32x32',
        age: 38,
        eyeColor: 'blue',
        name: 'Allyson Whitney',
        gender: 'female',
        company: 'EARTHPLEX',
        email: 'allysonwhitney@earthplex.com',
        phone: '+1 (993) 557-2063',
        address: '445 Neptune Avenue, Savage, California, 6171',
        about: 'Consequat occaecat incididunt ex sit adipisicing sint magna laborum anim excepteur laborum magna. Ipsum fugiat consequat velit consectetur quis quis commodo enim. Mollit voluptate do duis aliquip deserunt esse et amet. Mollit aute consectetur dolor duis quis consectetur esse aliquip velit est.\r\n',
        registered: '2014-12-02T12:58:36 -05:00',
        latitude: -81.547471,
        longitude: 81.942455,
        tags: ['amet', 'dolor', 'Lorem', 'qui', 'sint', 'in', 'tempor'],
        friends: [
            {
                id: 0,
                name: 'Concetta Pate'
            },
            {
                id: 1,
                name: 'Nixon Simpson'
            },
            {
                id: 2,
                name: 'Daniels Gilmore'
            }
        ],
        greeting: 'Hello, Allyson Whitney! You have 8 unread messages.',
        favoriteFruit: 'banana'
    },
    {
        _id: '604b24b4ccf22c1058b4420f',
        index: 4,
        guid: '2ae6d9be-021c-4b8c-beb3-1f98b0143284',
        isActive: true,
        balance: '$3,969.60',
        picture: 'http://placehold.it/32x32',
        age: 37,
        eyeColor: 'green',
        name: 'Allison Castillo',
        gender: 'female',
        company: 'ZENSUS',
        email: 'allisoncastillo@zensus.com',
        phone: '+1 (865) 588-2703',
        address: '457 Voorhies Avenue, Brookfield, Missouri, 6794',
        about: 'Laboris eu reprehenderit in voluptate excepteur voluptate non incididunt laborum elit. Tempor ad enim irure cillum excepteur eiusmod eu non duis ullamco voluptate ex. Officia nisi mollit tempor veniam est veniam ea reprehenderit sunt mollit ut irure exercitation. Sint adipisicing commodo duis pariatur minim qui cupidatat nostrud reprehenderit id exercitation consequat nulla.\r\n',
        registered: '2015-10-11T12:02:18 -05:00',
        latitude: 61.435039,
        longitude: -176.184058,
        tags: [
            'dolor',
            'ullamco',
            'veniam',
            'nisi',
            'exercitation',
            'do',
            'dolor'
        ],
        friends: [
            {
                id: 0,
                name: 'Patterson Rocha'
            },
            {
                id: 1,
                name: 'Josephine Robles'
            },
            {
                id: 2,
                name: 'Sallie Frazier'
            }
        ],
        greeting: 'Hello, Allison Castillo! You have 4 unread messages.',
        favoriteFruit: 'apple'
    },
    {
        _id: '604b24b42a14c296ac731af2',
        index: 5,
        guid: '535c802c-e390-4b23-a87f-74906d5c8b0e',
        isActive: true,
        balance: '$2,951.53',
        picture: 'http://placehold.it/32x32',
        age: 31,
        eyeColor: 'brown',
        name: 'Stacy Oliver',
        gender: 'female',
        company: 'DATAGEN',
        email: 'stacyoliver@datagen.com',
        phone: '+1 (927) 536-2652',
        address: '746 Rodney Street, Lodoga, Nevada, 4018',
        about: 'Laborum eiusmod enim et quis nisi consectetur aliquip incididunt consectetur fugiat adipisicing. Consectetur minim consectetur nostrud eiusmod mollit tempor. Qui culpa elit ex in qui in aliqua ullamco nostrud.\r\n',
        registered: '2018-04-03T05:23:51 -05:00',
        latitude: 2.30343,
        longitude: 55.465795,
        tags: ['elit', 'quis', 'ad', 'esse', 'laborum', 'laborum', 'ut'],
        friends: [
            {
                id: 0,
                name: 'Natalie Roberson'
            },
            {
                id: 1,
                name: 'Gilliam Gould'
            },
            {
                id: 2,
                name: 'Mathis Hodges'
            }
        ],
        greeting: 'Hello, Stacy Oliver! You have 3 unread messages.',
        favoriteFruit: 'strawberry'
    }
];
export const InspectorWrapper = (): JSX.Element => (
    <Component data={testData} />
);

InspectorWrapper.storyName = 'InspectorWrapper';
const Highlight: FC = () => {
    const [value, setValue] = useState('');
    const [hideUnrelated, setHideUnrelated] = useState(true);
    return (
        <section>
            <input
                type='text'
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <label>
                <input
                    type='checkbox'
                    checked={hideUnrelated}
                    onChange={(e) => setHideUnrelated(e.target.checked)}
                />
                hideUnrelated
            </label>
            <SearchContext.Provider value={{ value, hideUnrelated }}>
                <Component data={testData} />
            </SearchContext.Provider>
        </section>
    );
};
export const WithHighlight = (): JSX.Element => <Highlight />;
