import mapKeys from 'lodash/mapKeys';
import camelCase from 'lodash/camelCase';
import { TypedJSON } from 'typedjson';
import { EntityKind, StoredValue, SystemEntityType } from './StoredValue';
import { expect } from 'chai';
import { fail } from 'assert';

describe('StoredValue', () => {
  const serializer = new TypedJSON(StoredValue);

  // TODO: Add tests for StoredValue
  // it('should parse EntityKinds correctly', () => {
  //   const smartContractEntityKind = '"SmartContract"';
  //   const accountEntityKind =
  //     '{"Account":"account-hash-d83a21993aaa8cbc39e7597d91c4e444a204140e8032731ee40534cddfc8b438"}';
  //   const systemEntityKindMint = '{"System":"Mint"}';
  //   const systemEntityKindHandlePayment = '{"System":"HandlePayment"}';
  //   const systemEntityKindStandardPayment = '{"System":"StandardPayment"}';
  //   const systemEntityKindAuction = '{"System":"Auction"}';
  // });

  it('should parse Account stored value correctly', () => {
    const mockJson = {
      Account: {
        account_hash:
          'account-hash-97623c065702e82ccb15387a1fb8f4f89bd6c54ea3283831249404af8fd2e4bb',
        named_keys: [
          {
            name: 'contract_version',
            key:
              'uref-4d95be7a26ef0ca91f2a1755a7293dfd5a25f1a0f1b69057d7d852c42614ba91-007'
          },
          {
            name: 'faucet',
            key:
              'hash-1c16234ad1d27b51614ec5dca0bc28ea235eb2dc3a1f9d98aa238dc3df1fd63a'
          },
          {
            name: 'faucet_package',
            key:
              'hash-ea058d32053f59e9f66dd3d4de4594a8a3de36c65c87417efe79cdc7c1b926b4'
          },
          {
            name: 'faucet_package_access',
            key:
              'uref-9eab12b986299509b4471060fe4d17f087bdd2596871c38d39019ef94f8d10a6-007'
          }
        ],
        main_purse:
          'uref-657bec09f43593b985fca6a6c1a05c90c35cd85643f96722c9ca652e5d690b94-007',
        associated_keys: [
          {
            account_hash:
              'account-hash-97623c065702e82ccb15387a1fb8f4f89bd6c54ea3283831249404af8fd2e4bb',
            weight: 1
          }
        ],
        action_thresholds: {
          deployment: 1,
          key_management: 1
        }
      }
    };

    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.Account).not.eq(undefined);
    expect(storedValue?.Account?.accountHash()).to.eq(
      mockJson.Account.account_hash
    );
    expect(storedValue?.Account?.actionThresholds).not.eq(undefined);
    expect(storedValue?.Account?.namedKeys[0].name).to.eq('contract_version');
  });

  it('should parse Transfer stored value correctly', () => {
    const mockJson = {
      Transfer: {
        deploy_hash:
          'c5bed7511b23946a87c7237fceb55fe2f3a84ee28a41f3830f021711a1210047',
        from:
          'account-hash-97623c065702e82ccb15387a1fb8f4f89bd6c54ea3283831249404af8fd2e4bb',
        to:
          'account-hash-9244197a59bf76965c4981b04e5e58824d0ba450c68cc50246e83f1b6544638a',
        source:
          'uref-657bec09f43593b985fca6a6c1a05c90c35cd85643f96722c9ca652e5d690b94-007',
        target:
          'uref-5948995a53e298255f3ffc8e13843a5d11f2f5db42c701b38cb7a287b8055aba-004',
        amount: '1000000000',
        gas: '0',
        id: null
      }
    };

    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.Transfer).to.not.eq(undefined);
    expect(storedValue?.Transfer?.deployHash).to.eq(
      mockJson.Transfer.deploy_hash
    );
  });

  it('should parse Contract stored value correctly', () => {
    const mockJson = {
      Contract: {
        contract_package_hash: 'package-uref',
        contract_wasm_hash: 'wasm-hash-uref',
        protocol_version: '1.0.0'
      }
    };

    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.Contract).to.not.eq(undefined);
    expect(storedValue?.Contract?.contractPackageHash).to.eq(
      mockJson.Contract.contract_package_hash
    );
    expect(storedValue?.Contract?.contractWasmHash).to.eq(
      mockJson.Contract.contract_wasm_hash
    );
    expect(storedValue?.Contract?.protocolVersion).to.eq(
      mockJson.Contract.protocol_version
    );
  });

  it('should parse ContractPackageJson stored value correctly', () => {
    //
    const mockJson = {
      ContractPackage: {
        access_key:
          'uref-6bec50abe6751e45e82763e5a52914ab7062d2147009a88d3555c7fe83849182-007',
        versions: [
          {
            protocol_version_major: 1,
            contract_version: 1,
            contract_hash:
              'contract-2e64dbd1aea72e5b7ad3fa6cc64087150962fb13e5acdf2f886540b543ef0727'
          }
        ],
        disabled_versions: [],
        groups: [
          {
            group: 'admin_group',
            keys: [
              'uref-67a1de85bd97664bbd037be2e5b97e5175599e29422daf87619efd30c3e16182-007'
            ]
          },
          {
            group: 'constructor',
            keys: []
          }
        ]
      }
    };

    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.ContractPackage?.accessKey).to.eq(
      mockJson.ContractPackage.access_key
    );
    expect(storedValue?.ContractPackage?.versions).to.deep.eq(
      mockJson.ContractPackage.versions.map(version =>
        mapKeys(version, (_value, key) => camelCase(key))
      )
    );
  });

  it('should parse DeployInfo stored value correctly', () => {
    const mockJson = {
      DeployInfo: {
        deploy_hash:
          'c5bed7511b23946a87c7237fceb55fe2f3a84ee28a41f3830f021711a1210047',
        transfers: [
          'transfer-c6c3694f3760c562ca41bcfb394f10783e529d336f17a11900b57234830b3e13'
        ],
        from:
          'account-hash-97623c065702e82ccb15387a1fb8f4f89bd6c54ea3283831249404af8fd2e4bb',
        source:
          'uref-657bec09f43593b985fca6a6c1a05c90c35cd85643f96722c9ca652e5d690b94-007',
        gas: '0'
      }
    };

    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.DeployInfo).to.not.eq(undefined);
    expect(storedValue?.DeployInfo?.deployHash).to.eq(
      mockJson.DeployInfo.deploy_hash
    );
    expect(storedValue?.DeployInfo?.from).to.eq(mockJson.DeployInfo.from);
  });

  it('should parse StoredValue::AddressableEntity', () => {
    const mockJson = {
      AddressableEntity: {
        protocol_version: '2.0.0',
        entity_kind: {
          SmartContract: 'VmCasperV2'
        },
        package_hash:
          'package-66875d4ede5b20ef9eab0bc645816ba81091ac9b4fd3f7fb0a7ad117a7be2345',
        byte_code_hash:
          'byte-code-1d2ce81c314980ebe061fcf04f247fc71baec03883ab553c05f06b77f560d3e3',
        main_purse:
          'uref-14a31fa401c230c62510b53a0b5be3d168ce19fb10149c2fdd0dac9a0230e5e5-006',
        associated_keys: [
          {
            account_hash:
              'account-hash-c67943ffec1df35e18f80c2ecfd7ce20685318a6ca831f2bb50e35eca7582f46',
            weight: 10
          }
        ],
        action_thresholds: {
          deployment: 5,
          upgrade_management: 6,
          key_management: 7
        },
        message_topics: [
          {
            topic_name: 'xyz',
            topic_name_hash:
              '203084cb67a4249aee1235cd3d98ca7dca842356ec002a0f1721e7d11d0e2c88'
          }
        ]
      }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.AddressableEntity).to.not.eq(undefined);
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::AddressableEntity is undefined');
    }
  });

  it('should parse StoredValue::BidKind::Unified', () => {
    const mockJson = {
      BidKind: {
        Unified: {
          validator_public_key:
            '020366da0f5115ecc2a9015f2bab9313f69ccab76d3174b6f692bf06f014a307d929',
          bonding_purse:
            'uref-ebb7d2c07315ea1c33aaad584d9b79976de44a14e69033ff2ba1e7f90bed24be-004',
          staked_amount: '74565',
          delegation_rate: 110,
          vesting_schedule: {
            initial_release_timestamp_millis: 624,
            locked_amounts: [
              '8276419801343304761227951397726079482995260638959279224592586611504041812344246127052097846914964386274625420774484904239159639382345489166682058079750154',
              '6456384588066932926103922617571873804935925300065554055545105755566823119123397101475484062599011311977798267047381393967132842846698282972612168787882543',
              '5502432196202044115408042602345267046195148649775621791905599066292338303438702077600535708811270083957586485261067913646141987617917767432046031528559727',
              '6777073687002066238611069058658178862464147735278734730172859857344909153626332275424857216568883774461575237854337870117857364734785124302509091137489644',
              '2871659532347051392113958629705371668917559047659441413194562594944060974655752341072639597393269770962795592785276446381768074186267155953567975508982480',
              '11688402902974447649436290564425401651060951797888676578219533723842110676245882067595438507271645705118796946546384929628417935013460349163624695932650659',
              '7319901134715825005966634593374617000138760474996277503219444310878529083734204150328943636226028752445504983219116936098958188672311687044700699268935658',
              '506239321104456483596119759424472629268039662742878848939658574314254873830825741083906845240693924382246956701791927496307966222485021490356559669625643',
              '8127870396756887879619721108617495069188697498117255768858043646296558478078890781683105949615353207750449150830197050401549197531115910539817147871851',
              '9842978481579798816238533318375998637171730927944222151895557917813963219086732969612023520292990874037681451479676840585852653617814246306821096988555990',
              '7987770866920660245410857071906050488286626157449853612060207135013949640150362678630000109219964921629070776875060011163423858149517123103258622427454916',
              '11571216491139110651714520949072305726717521519991403346762215484463626180128519920726818992539878305634113265849968495064345071358289304762776749351851103',
              '10325876982647640888033754759703998325445614225568075374024264952711435704234541490744834462429748325912748056924080604160148382859094085480293401455767465',
              '786688203413758560575207394885078676956794527727790808402010345270120054375935712731388713484140066199319253157605054120979739645735805932587785529114831'
            ]
          },
          delegators: [
            {
              delegator_public_key:
                '01a44db734fdac4e2a2c9c08d24fcf692530ced50d95d6992156739b4c773b6a56',
              delegator: {
                delegator_public_key:
                  '0202225fcf238c16a50b42563e8d62116bb754c883dc7f8d87f43472c2fa306578f2',
                staked_amount:
                  '5698451137764551561569228900237940224001606365202100733913067450432176147762133054652027478480635629947419442614447504152387240017235654965344485968652251',
                bonding_purse:
                  'uref-19a4d3fb7d6123caa63dc03b4d53ad65dd4b0adab5cf7afb796a4da8cae6a2b1-004',
                validator_public_key:
                  '0168752494f7afe877b6ab79bc2a893eaeafb3c42d4af072d22b87ba9205a9ffce',
                vesting_schedule: {
                  initial_release_timestamp_millis: 824,
                  locked_amounts: [
                    '734710005818037584522279134619578860358000098139516742573658872997914767549136778266526757191995575300570444200785288826273654835324922875415190327284595',
                    '13135347695681127301886728416439578361819226770463820782756420412075375822066245632827830585102571737992356280440503740797609211922907049567197863569193951',
                    '7166845660746490883151060280600899918056772622788828670089041212733194249531629687576730516232353589732787445728973871183181891175999730210449954618852758',
                    '6900872808228514965107309283781301312018841811696469449119376343649418096087377502084541660642825205718087332401921160557273511343377236553383144359476805',
                    '13319426820830748775325138179769014973437599112466342769306935852792766972722552519028704575702473422415809114051623344558700652510641485203171963553739133',
                    '10500092400923231946986488365242002565587827191948297479986723351634446701071938974072819195235758290542968126904561352727893057966803930238454888838022024',
                    '7300821094517583698701293391884369940522024330692147564893343073368825795587130188343658133266763480592912994221520181914530291893781659218198235397252278',
                    '13225144478193078236809573679985709971398598305230294959953515844425338851902828238376941484283823519746062630019015054981769394576841307471898924635694919',
                    '5002772396530338845210625793487703185775932004523417469521945652557039741477717671902470443082188949859014624020110278723909144755671341285908147905883798',
                    '10160787459882811995326031519108185526636220061507349259454835158927021907958933276771369405071336744951620812606579908029202424285906182194607172568463050',
                    '9505079759676754574884821360861522175334787006859048660781653738278912215285407058912539766479534549772031193582824706894673446973076364411798705355505378',
                    '971115976660929171635080062667775338990745974194088775230343821431785653343228270426412302726699014992786162481597759432838669744036920441773574142168474',
                    '1539602148376247812273493628552524099175421017079164671786810059327246896423525773367458952360992903449465877116598263405661760265610091535260496654605717',
                    '9418733028636440738898451671120847681337067217054840384265082886015741762079311704868199558175462865773023494754046999924560443772889578740143584260291751'
                  ]
                }
              }
            }
          ],
          inactive: false
        }
      }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.BidKind).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::BidKind is undefined');
    }
  });

  it('should parse StoredValue::BidKind::Validator', () => {
    const mockJson = {
      BidKind: {
        Validator: {
          validator_public_key:
            '01a0eb880a4104c197e8201746b65b20c08165edc8a14f706a92e0d6eb977d4a6d',
          bonding_purse:
            'uref-63d5078301bf1577fd523aebbc3c676de3e4c62fc0829e2331abd19fdf4f456a-005',
          staked_amount:
            '6033340512286073789060857094057936745114791160786740113949793544450405462271704409723268618192803935071027828636310083796848088711171450398189695002833952',
          delegation_rate: 111,
          vesting_schedule: {
            initial_release_timestamp_millis: 824,
            locked_amounts: [
              '1484785956832362008273355258552024023364650072243495216899441387987997856747145809717567736037480856345589459913647044189943941545507928593203317191772675',
              '882029163629058930800205368843002400718762974316407839579473452656877313958840552351678514839054322812591790035076071829304984122480687046415228632150207',
              '10585467470571398480925372947575114376870009920543448290485394586168211955169810758180115685218297497636832021256938251702172429566428824075908820083628743',
              '8572884375112951034516304956425474603671576406116044685621975433930674788725892576734269015016120614143843907215984319855232105238602408267234570444253571',
              '10850458227266577375739924032319578302428482672320763703391893016112351980898672059347667206167556446842637348170651475179545214120057644155166315951254229',
              '130198942271886143160066209394210827517305643762805499867964334641129173956897135477261149921756412424502975727947663627403893689046935238343565238204541',
              '11643315318693440337820467457022701055274603549647410005503054728100159154641177864573678735993144359218384788816893026097153958536824236591129074497457320',
              '4074912600220734844822665777677010246287603301501736354759652324235516788634182363901733286690589740243885964277242685577696385595371762549975911698984508',
              '2794095910532818570293182948639132470665782446787091780430470033782737972049650517224536647779263378308507576366997706771989031772308157482272906556844243',
              '11981816054094622890517405493676478324732866613206576649219214388555100867025731223351596026054844198479236972903883324057309617894049692800326754631071173',
              '1190511120748636125822687068666480132842227594838972400638182706773739966153263757444792041830049208798178846261293905706592581032837141316288359502863479',
              '2778056460200132346887808653010244444159971948176746362316592332336128028657667132588127886266451985579961296502796082759342385796339536321251490432890779',
              '409639479805948243327693172530941233363292441996610898968100232325198916646102467630677842642188041007221529585996514716902908287342349848703818996439479',
              '5969480939990294110921893089715906510014538705396745737900842087235217563488122938131338494574886136261545143513167200205074287516017446810251062807596389'
            ]
          },
          inactive: false
        }
      }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.BidKind).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::BidKind is undefined');
    }
  });

  it('should parse StoredValue::BidKind::Delegator', () => {
    const mockJson = {
      BidKind: {
        Delegator: {
          delegator_public_key:
            '019aaca21b3952f7e1cdabc0108b3bf48a9ffa95a1b8ff14cfe82c3bccfe0a536d',
          staked_amount:
            '12006219068247571294422117091861919449677758666357610596508516278787475080170886179152569625925558443626850838907221994638075235526704707462411984227680562',
          bonding_purse:
            'uref-a2af88ee48d368aa47b653dc192860c6b1ba4d3b2023b31822c6d423922b2d04-003',
          validator_public_key:
            '02038accf9862fa643308226231897b2d15925ed069a0de81d91e6fbb4d77eb0063b',
          vesting_schedule: {
            initial_release_timestamp_millis: 824,
            locked_amounts: [
              '11820156092539366307858489065324906387779859461471203243253066835774617769222443424847015517126149637936587800580907937195974678165941653084196946442577258',
              '1941377508671769620047310895617792815092862740912485116623012593516094985939944943446011405522706326610087289210191563574238449638355455548926886720319303',
              '2114512260285478875695301365383893878184044164937725539536594119510421799595010560556765917651278231370110469092385584971159927113095514232740371622175421',
              '8558853259519434219418765913741514538152835587249475152002914743616143787771715896310713201244865877403105878741360450830024891005077675765400358789457756',
              '811725957478505369545755436611135262111349272620814320970345516055002234356392418791874496748934151107754776286743935553342095220046257344503171254620460',
              '484382435390809312530575817781200005151977913655899618617316848778921364511350787021701210313589390288942592516439244975774003528282325911483417393588601',
              '10108117044695384835475484048899035677580104629274003471308728099735749898581579297383957080378712664648577688256847585648664406863460653625433782429581830',
              '3843341863518898448386112214583061594694605993195567536299679175162163424367745168587783292034313866755316711184663523102338640905391878622837082986365002',
              '6882976426632781205722054039523322192441716483417628496344058732481578833221676267952993512724172614980252881952891966731077368684367884718099806335044737',
              '9087222135623865857943844852003938572752518605417918233014802906860841158791015921881693089128382695494400154209416463669985612444708838268096039452569768',
              '1281810805651565404191962086608934403260122276135053206702762376285658961827923602252819592546373879043357671308525155997356994886789603380494687974250635',
              '1106525349663857788136042136625823736843672722899036416875737167070511290710773197910189873480974777631342686105115422851165592935220493271660449769668047',
              '11140195587350368521141417692378118242548106365464003963276057841889095181227957743199135875433497179621147948078488737969170279578576913135323725976624549',
              '1676947294289547443595630535443856393323610101509345902106349628088578898084697701490648761543727447991841551570367184793246458009746242495511830396441598'
            ]
          }
        }
      }
    };

    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.BidKind).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::BidKind is undefined');
    }
  });

  it('should parse StoredValue::BidKind::Bridge', () => {
    const mockJson = {
      BidKind: {
        Bridge: {
          old_validator_public_key:
            '0202c79ca3cd4062720b07da612a1b667fbf35bf6f317aefc7fc4c7412831c77bb74',
          new_validator_public_key:
            '0126ccf78720df9294343fecc6c8ef2152765c477f9e4d749a3b72e1c9b9960e17',
          era_id: 275
        }
      }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.BidKind).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::BidKind is undefined');
    }
  });

  it('should parse StoredValue::Package', () => {
    const mockJson = {
      Package: {
        versions: [
          {
            entity_version_key: {
              protocol_version_major: 1,
              entity_version: 1
            },
            addressable_entity_hash:
              'addressable-entity-2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a2a'
          },
          {
            entity_version_key: {
              protocol_version_major: 1,
              entity_version: 2
            },
            addressable_entity_hash:
              'addressable-entity-5454545454545454545454545454545454545454545454545454545454545454'
          }
        ],
        disabled_versions: [
          {
            protocol_version_major: 1,
            entity_version: 1
          }
        ],
        groups: [
          {
            group_name: 'Group 1',
            group_users: [
              'uref-0101010101010101010101010101010101010101010101010101010101010101-001'
            ]
          },
          {
            group_name: 'Group 2',
            group_users: [
              'uref-0101010101010101010101010101010101010101010101010101010101010102-001'
            ]
          }
        ],
        lock_status: 'Unlocked'
      }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.Package).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::Package is undefined');
    }
  });

  it('should parse StoredValue::ByteCode', () => {
    const mockJson = {
      ByteCode: {
        kind: 'V1CasperWasm',
        bytes:
          '576e5963614b79573379706f6d51644e574c4c4f673970774b3841736f745779576e5963614b79573379706f6d51644e574c4c4f673970774b3841736f745779576e5963614b79573379706f6d51644e574c4c4f673970774b3841736f745779'
      }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.ByteCode).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::ByteCode is undefined');
    }
  });

  it('should parse StoredValue::MessageTopic', () => {
    const mockJson = {
      MessageTopic: { message_count: 555, blocktime: 1234567 }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.MessageTopic).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::MessageTopic is undefined');
    }
  });

  it('should parse StoredValue::Message', () => {
    const mockJson = {
      Message:
        'message-checksum-3b0e23345fdf8f68aa9c782c5cbca666fe6017689ec31183d1106b0ebcaf6a57'
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.Message).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::Message is undefined');
    }
  });

  it('should parse StoredValue::Reservation', () => {
    const mockJson = {
      Reservation: {
        receipt:
          'd57e0c864264631c418a24e75642180c10df14af91f80eb6adc15e55534bccbe',
        reservation_kind: 6,
        reservation_data:
          'd2e2d25508244d394640db401df4b8cd39e3587b0b9db34a44f218d8263b1befab775155e0933c0bd0f8bca42e270f3e9c8ec0b7c8c70ac6097b17ca6c7c93a2eda228831907ff74d86985d845ed37b2567a9c2ce5dcbad40e4356'
      }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.Reservation).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::Reservation is undefined');
    }
  });

  it('should parse StoredValue::EntryPoint::V1CasperVm', () => {
    const mockJson = {
      EntryPoint: {
        V1CasperVm: {
          name: 'xyz',
          args: [
            {
              name: 'x',
              cl_type: 'Key'
            },
            {
              name: 'y',
              cl_type: 'U128'
            }
          ],
          ret: 'U512',
          access: {
            Groups: ['a1', 'b2', 'c3']
          },
          entry_point_type: 'Caller',
          entry_point_payment: 'SelfOnward'
        }
      }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.EntryPoint).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::EntryPoint is undefined');
    }
  });

  it('should parse StoredValue::EntryPoint::V2CasperVm', () => {
    const mockJson = {
      EntryPoint: { V2CasperVm: { function_index: 167, flags: 555 } }
    };
    const storedValue = serializer.parse(mockJson);
    expect(storedValue?.EntryPoint).not.to.be.undefined;
    if (storedValue) {
      const reserialized = JSON.parse(serializer.stringify(storedValue));
      expect(reserialized).to.deep.eq(mockJson);
    } else {
      fail('StoredValue::EntryPoint is undefined');
    }
  });
});

describe('EntityKind', () => {
  const serializer = new TypedJSON(EntityKind);
  it('should parse SystemEntityType: Mint correctly', () => {
    const mockJson = {
      System: 'Mint'
    };
    const entityKind = serializer.parse(mockJson);
    expect(entityKind?.System).to.eq(SystemEntityType.Mint);
  });

  it('should parse SystemEntityType: Auction correctly', () => {
    const mockJson = {
      System: 'Auction'
    };
    const entityKind = serializer.parse(mockJson);
    expect(entityKind?.System).to.eq(SystemEntityType.Auction);
  });

  it('should parse SystemEntityType: HandlePayment correctly', () => {
    const mockJson = {
      System: 'HandlePayment'
    };
    const entityKind = serializer.parse(mockJson);
    expect(entityKind?.System).to.eq(SystemEntityType.HandlePayment);
  });

  it('should parse SystemEntityType: StandardPayment correctly', () => {
    const mockJson = {
      System: 'StandardPayment'
    };
    const entityKind = serializer.parse(mockJson);
    expect(entityKind?.System).to.eq(SystemEntityType.StandardPayment);
  });

  it('should parse Account EntityKind correctly', () => {
    const mockJson = {
      Account: 'abcdefgh'
    };
    const entityKind = serializer.parse(mockJson);
    expect(entityKind?.Account).to.eq('abcdefgh');
  });

  it('should parse SmartContract: VmCasperV1 correctly', () => {
    const mockJson = {
      SmartContract: 'VmCasperV1'
    };
    const entityKind = serializer.parse(mockJson);
    expect(entityKind?.SmartContract).to.eq('VmCasperV1');
  });

  it('should parse SmartContract: VmCasperV2 correctly', () => {
    const mockJson = {
      SmartContract: 'VmCasperV2'
    };
    const entityKind = serializer.parse(mockJson);
    expect(entityKind?.SmartContract).to.eq('VmCasperV2');
  });
});
