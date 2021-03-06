export default (() => {
    let o;
    return Jymfony.Component.VarExporter.Internal.Hydrator.hydrate(
        o = [
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.RuleSet')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
            (new ReflectionClass('Jymfony.Component.DateTime.Internal.Rule')).newInstanceWithoutConstructor(),
        ],
        null,
        {
            'Jymfony.Component.DateTime.Internal.RuleSet': {
                ['_name']: {
                    ['0']: undefined,
                },
                ['_rules']: {
                    ['0']: [
                        o[1],
                        o[2],
                        o[3],
                        o[4],
                        o[5],
                        o[6],
                        o[7],
                        o[8],
                        o[9],
                        o[10],
                        o[11],
                    ],
                },
                ['_cache']: {
                    ['0']: {},
                },
            },
            'Jymfony.Component.DateTime.Internal.Rule': {
                ['_fromYear']: {
                    ['1']: 1983,
                    ['2']: 1984,
                    ['3']: 1983,
                    ['4']: 1988,
                    ['5']: 1988,
                    ['6']: 2005,
                    ['7']: 2005,
                    ['8']: 2012,
                    ['9']: 2012,
                    ['10']: 2017,
                    ['11']: 2017,
                },
                ['_toYear']: {
                    ['1']: 1983,
                    ['2']: 1987,
                    ['3']: 1987,
                    ['4']: 1997,
                    ['5']: 1997,
                    ['6']: 2006,
                    ['7']: 2006,
                    ['8']: 2015,
                    ['9']: 2015,
                    ['10']: Infinity,
                    ['11']: Infinity,
                },
                ['_inMonth']: {
                    ['1']: 5,
                    ['2']: 4,
                    ['3']: 10,
                    ['4']: 4,
                    ['5']: 10,
                    ['6']: 4,
                    ['7']: 10,
                    ['8']: 3,
                    ['9']: 11,
                    ['10']: 3,
                    ['11']: 11,
                },
                ['_on']: {
                    ['1']: '8',
                    ['2']: 'last sun %s',
                    ['3']: 'last sun %s',
                    ['4']: '1 %s this sun',
                    ['5']: 'last sun %s',
                    ['6']: '1 %s this sun',
                    ['7']: 'last sun %s',
                    ['8']: '8 %s this sun',
                    ['9']: '1 %s this sun',
                    ['10']: '8 %s this sun',
                    ['11']: '1 %s this sun',
                },
                ['_at']: {
                    ['1']: '0:00',
                    ['2']: '0:00',
                    ['3']: '0:00',
                    ['4']: '1:00s',
                    ['5']: '1:00s',
                    ['6']: '0:00',
                    ['7']: '0:00',
                    ['8']: '2:00',
                    ['9']: '2:00',
                    ['10']: '2:00',
                    ['11']: '2:00',
                },
                ['_save']: {
                    ['1']: 3600,
                    ['2']: 3600,
                    ['3']: 0,
                    ['4']: 3600,
                    ['5']: 0,
                    ['6']: 3600,
                    ['7']: 0,
                    ['8']: 3600,
                    ['9']: 0,
                    ['10']: 3600,
                    ['11']: 0,
                },
                ['_letters']: {
                    ['1']: 'D',
                    ['2']: 'D',
                    ['3']: 'S',
                    ['4']: 'D',
                    ['5']: 'S',
                    ['6']: 'D',
                    ['7']: 'S',
                    ['8']: 'D',
                    ['9']: 'S',
                    ['10']: 'D',
                    ['11']: 'S',
                },
                ['_cache']: {
                    ['1']: {},
                    ['2']: {},
                    ['3']: {},
                    ['4']: {},
                    ['5']: {},
                    ['6']: {},
                    ['7']: {},
                    ['8']: {},
                    ['9']: {},
                    ['10']: {},
                    ['11']: {},
                },
            },
        },
        [
            {
                ['offset']: -17360,
                ['dst']: false,
                ['abbrev']: 'LMT',
                ['until']: -2524504240,
                ['format']: 'LMT',
            },
            {
                ['offset']: -17340,
                ['dst']: false,
                ['abbrev']: 'PPMT',
                ['until']: -1670483460,
                ['format']: 'PPMT',
            },
            {
                ['until']: Infinity,
                ['ruleSet']: o[0],
                ['offset']: -18000,
                ['abbrev']: 'E%sT',
            },
        ],
        [
            0,
        ]
    );
})();
;
