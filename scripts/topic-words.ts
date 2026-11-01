import { LIFE_TOPICS, type LifeTopic } from "../src/lib/topics";
import { MORE_TOPIC_WORDS } from "./topic-words-more";
import { list } from "./topic-words-list";

// Danh sách từ cốt lõi cho từng chủ đề đời sống, dùng cho `npm run db:assign-topics`.
// Mỗi từ là một mục (headword) tiếng Anh viết thường; một từ có thể nằm ở nhiều chủ đề.
// Thứ tự trong danh sách là thứ tự học: chủ đề được chia thành bài theo thứ tự này
// (LESSON_SIZE trong src/lib/practice/config.ts). Từ mới thêm vào cuối, hoặc vào
// scripts/topic-words-more.ts, để các bài cũ giữ nguyên.

const CORE_TOPIC_WORDS: Record<LifeTopic, readonly string[]> = {
  family: list(`
    family, mother, father, parent, son, daughter, brother, sister, sibling, husband, wife, spouse,
    child, baby, grandmother, grandfather, grandparent, grandson, granddaughter, grandchild, uncle,
    aunt, nephew, niece, cousin, relative, ancestor, descendant, generation, twin, orphan,
    stepmother, stepfather, stepson, stepdaughter, stepbrother, stepsister, mother-in-law,
    father-in-law, son-in-law, daughter-in-law, brother-in-law, sister-in-law, bride, bridegroom,
    groom, wedding, marriage, marry, divorce, engagement, widow, widower, couple, household, home,
    kin, offspring, heir, inherit, inheritance, adopt, adoption, foster, guardian, raise,
    upbringing, pregnant, pregnancy, birth, birthday, anniversary, honeymoon, babysitter, nanny,
    toddler, infant, teenager, adult, elder, elderly, youth, childhood, motherhood, fatherhood,
    parenthood, maternal, paternal, mum, mom, dad, daddy, grandma, grandpa, granny, surname,
    nickname, tradition, reunion, gathering, quarrel, obey, spoil, lullaby, cradle, pram, crib,
    nappy, diaper, housewife, chore, bond
  `),
  friends: list(`
    friend, friendship, mate, buddy, pal, companion, partner, classmate, roommate, neighbour,
    neighbor, acquaintance, stranger, guest, host, enemy, rival, boyfriend, girlfriend, lover,
    sweetheart, darling, honey, date, crush, flirt, romance, romantic, love, hug, kiss, cuddle,
    embrace, trust, loyal, loyalty, betray, betrayal, jealous, jealousy, argument, apologize,
    apology, forgive, forgiveness, promise, secret, gossip, rumour, rumor, chat, visit, invite,
    invitation, party, celebrate, celebration, gift, present, share, support, advice, advise,
    comfort, kindness, friendly, unfriendly, close, intimate, relationship, connection, contact,
    meet, introduce, introduction, greet, greeting, farewell, miss, reunite, team, group, club,
    member, community, social, sociable, popular, lonely, loneliness, alone, together, mutual,
    sympathy, understanding, respect, admire, admiration, compliment, praise, tease, joke, prank,
    fun, propose, proposal, reconcile, harmony, conflict, peace, ally, solidarity, bond, care
  `),
  people: list(`
    person, people, man, woman, boy, girl, gentleman, lady, human, individual, character,
    personality, appearance, tall, short, fat, thin, slim, overweight, skinny, handsome,
    beautiful, pretty, ugly, attractive, cute, young, old, middle-aged, blond, blonde, bald,
    curly, beard, moustache, mustache, freckle, wrinkle, dimple, clever, intelligent, smart, wise,
    stupid, foolish, silly, kind, cruel, generous, mean, selfish, polite, rude, honest, dishonest,
    brave, coward, shy, confident, modest, arrogant, proud, humble, lazy, hard-working, diligent,
    patient, impatient, calm, nervous, outgoing, talkative, quiet, serious, funny, humorous,
    cheerful, optimistic, pessimistic, ambitious, careful, careless, responsible, reliable,
    stubborn, flexible, creative, curious, sensible, sensitive, emotional, mature, immature,
    independent, gentle, rough, aggressive, strict, easy-going, sincere, naughty, obedient,
    nationality, gender, male, female, age, adult, teenager, elderly, citizen, resident, crowd
  `),
  "body-health": list(`
    body, head, hair, face, forehead, eye, eyebrow, eyelash, ear, nose, mouth, lip, tongue, tooth,
    cheek, chin, jaw, neck, throat, shoulder, arm, elbow, wrist, hand, finger, thumb, nail, chest,
    breast, stomach, belly, waist, hip, back, spine, leg, thigh, knee, ankle, foot, heel, toe,
    skin, bone, muscle, blood, heart, lung, liver, kidney, brain, health, healthy, ill, illness,
    sick, sickness, disease, pain, ache, headache, toothache, stomachache, fever, cough, cold,
    flu, sneeze, sore, wound, injury, hurt, bleed, bruise, burn, rash, allergy, infection, virus,
    cancer, diabetes, doctor, nurse, dentist, patient, hospital, clinic, pharmacy, medicine, pill,
    tablet, drug, injection, vaccine, prescription, treatment, cure, recover, recovery, surgery,
    operation, ambulance, emergency, symptom, diet, exercise, sleep, rest, tired, weight, fit,
    fitness, breathe, breath, pulse, temperature, bandage, thermometer, sweat, vomit, dizzy
  `),
  "food-drink": list(`
    food, drink, meal, breakfast, lunch, dinner, supper, snack, dessert, rice, bread, noodle,
    soup, meat, beef, pork, chicken, fish, seafood, shrimp, prawn, crab, egg, milk, cheese,
    butter, yoghurt, yogurt, cream, sugar, salt, pepper, sauce, oil, vinegar, flour, vegetable,
    carrot, potato, tomato, onion, garlic, cabbage, lettuce, cucumber, bean, pea, corn, mushroom,
    pumpkin, fruit, apple, banana, orange, lemon, mango, grape, strawberry, pineapple, watermelon,
    coconut, peach, pear, cherry, papaya, water, juice, tea, coffee, beer, wine, soda, cake,
    cookie, biscuit, candy, sweet, chocolate, pie, pizza, sandwich, hamburger, sausage, bacon,
    ham, salad, steak, pasta, honey, jam, cereal, nut, peanut, delicious, tasty, sour, bitter,
    salty, spicy, fresh, raw, cook, boil, fry, bake, grill, roast, steam, stir, chop, slice,
    peel, recipe, restaurant, menu, waiter, waitress, chef, order, bill, tip, bowl, plate, cup,
    glass, spoon, fork, knife, chopsticks, hungry, thirsty, appetite, flavour, flavor, taste,
    vegetarian, ingredient, dish
  `),
  home: list(`
    house, home, apartment, flat, room, bedroom, bathroom, kitchen, garage, garden, yard,
    balcony, roof, wall, floor, ceiling, door, window, stairs, staircase, gate, fence, chimney,
    basement, attic, hall, corridor, furniture, table, chair, sofa, couch, bed, pillow, blanket,
    sheet, mattress, wardrobe, closet, cupboard, drawer, shelf, desk, lamp, light, curtain,
    carpet, rug, mirror, clock, picture, vase, fridge, refrigerator, freezer, oven, stove, cooker,
    microwave, kettle, toaster, dishwasher, sink, tap, faucet, shower, bath, bathtub, toilet,
    towel, soap, shampoo, toothbrush, toothpaste, comb, broom, mop, bucket, dustbin, rubbish,
    garbage, trash, vacuum, iron, heater, fan, key, lock, doorbell, neighbour, rent, landlord,
    tenant, move, decorate, clean, tidy, messy, wash, sweep, dust, cosy, cozy, spacious, address,
    cushion, plug, socket, switch, housework
  `),
  clothes: list(`
    clothes, clothing, garment, wear, dress, skirt, shirt, t-shirt, blouse, trousers, pants,
    jeans, shorts, jacket, coat, suit, sweater, jumper, cardigan, vest, uniform, pyjamas, pajamas,
    underwear, sock, stocking, tights, shoe, boot, sandal, slipper, sneaker, trainer, heel, hat,
    cap, helmet, scarf, glove, mitten, belt, tie, bow, button, zip, zipper, pocket, collar,
    sleeve, hood, raincoat, swimsuit, bikini, apron, bag, handbag, purse, wallet, backpack,
    umbrella, jewellery, jewelry, necklace, ring, earring, bracelet, watch, glasses, sunglasses,
    fashion, fashionable, style, stylish, model, designer, size, fit, tight, loose, cotton, wool,
    silk, leather, denim, fabric, cloth, pattern, striped, plain, tailor, sew, knit, iron, fold,
    hanger, wardrobe, undress, outfit, costume, gown, robe, overcoat, waistcoat, lace, ribbon,
    embroidery, laundry
  `),
  shopping: list(`
    shop, store, shopping, supermarket, market, mall, shopkeeper, customer, cashier, assistant,
    salesman, seller, buyer, buy, sell, pay, price, cost, cheap, expensive, discount, sale,
    bargain, offer, receipt, bill, change, cash, money, coin, banknote, credit, card, wallet,
    purse, basket, trolley, cart, bag, queue, counter, checkout, shelf, aisle, brand, product,
    goods, item, quality, quantity, size, refund, return, exchange, guarantee, warranty, deliver,
    delivery, order, online, catalogue, catalog, advertisement, coupon, voucher, gift, wrap,
    package, parcel, afford, spend, save, waste, owe, borrow, lend, loan, bank, account, tax,
    value, worth, choose, choice, compare, browse, bakery, butcher, florist, grocery, grocer,
    pharmacy, bookshop, bookstore, stall, vendor, kiosk, stock, weigh, kilogram, gram, dozen,
    packet, bottle, can, tin, jar, box, fitting
  `),
  school: list(`
    school, class, classroom, lesson, subject, teacher, student, pupil, principal, headmaster,
    classmate, homework, exercise, test, exam, examination, quiz, mark, grade, score, pass, fail,
    study, learn, teach, read, write, spell, calculate, book, notebook, textbook, dictionary, pen,
    pencil, rubber, eraser, ruler, sharpener, crayon, chalk, blackboard, board, desk, schoolbag,
    uniform, timetable, semester, term, holiday, vacation, break, library, laboratory, playground,
    canteen, gym, university, college, kindergarten, primary, secondary, degree, diploma,
    certificate, graduate, graduation, scholarship, tuition, fee, course, lecture, lecturer,
    professor, tutor, essay, report, project, research, knowledge, education, educate,
    mathematics, maths, science, history, geography, literature, physics, chemistry, biology,
    music, art, language, question, answer, mistake, correct, explain, understand, remember,
    forget, revise, practice, practise, attend, absent, punish, reward, prize, dormitory, campus,
    alphabet, sentence, paragraph, page, chapter
  `),
  work: list(`
    work, job, career, occupation, profession, employ, employer, employee, worker, staff, boss,
    manager, director, colleague, team, office, company, firm, business, factory, industry,
    salary, wage, income, bonus, promotion, promote, hire, fire, dismiss, resign, retire,
    retirement, unemployed, unemployment, interview, application, apply, candidate, experience,
    skill, qualification, contract, meeting, conference, project, task, duty, responsibility,
    deadline, schedule, report, document, e-mail, email, presentation, negotiate, agreement,
    client, customer, partner, profit, loss, budget, invest, investment, trade, market,
    marketing, advertising, accountant, lawyer, engineer, architect, mechanic, electrician,
    plumber, carpenter, farmer, driver, pilot, police, policeman, firefighter, fireman, soldier,
    journalist, reporter, photographer, secretary, receptionist, scientist, programmer,
    designer, artist, writer, actor, singer, cook, waiter, cleaner, guard, shift, overtime,
    leave, strike, union, workplace, earn
  `),
  travel: list(`
    travel, trip, journey, tour, tourist, tourism, holiday, vacation, visit, visitor,
    sightseeing, destination, abroad, foreign, foreigner, passport, visa, ticket, booking, book,
    reserve, reservation, luggage, baggage, suitcase, backpack, map, guide, guidebook, brochure,
    hotel, hostel, motel, resort, room, reception, receptionist, camping, camp, tent, beach,
    island, mountain, lake, river, sea, coast, city, town, village, country, countryside,
    capital, museum, temple, pagoda, church, castle, palace, monument, statue, park, zoo,
    souvenir, photo, photograph, camera, airport, flight, plane, aeroplane, airplane, airline,
    departure, arrival, depart, arrive, delay, cancel, gate, terminal, customs, border, currency,
    exchange, embassy, itinerary, explore, adventure, cruise, voyage, excursion, landscape,
    scenery, view, sunbathe, swim, hike, local, culture, tradition, festival, insurance,
    accommodation, traveller, traveler
  `),
  transportation: list(`
    car, bus, coach, taxi, train, tram, subway, underground, metro, bicycle, bike, motorbike,
    motorcycle, scooter, truck, lorry, van, ambulance, boat, ship, ferry, yacht, canoe, plane,
    helicopter, road, street, highway, motorway, lane, bridge, tunnel, crossroads, intersection,
    roundabout, traffic, jam, signal, sign, pavement, sidewalk, crossing, pedestrian, driver,
    passenger, conductor, pilot, captain, station, stop, platform, port, harbour, harbor,
    airport, parking, park, garage, petrol, gasoline, gas, fuel, engine, wheel, tyre, tire,
    brake, seat, helmet, licence, license, drive, ride, steer, accelerate, overtake, turn,
    reverse, crash, accident, collision, speed, fast, slow, distance, kilometre, kilometer, mile,
    route, direction, north, south, east, west, left, right, straight, corner, transport,
    transportation, vehicle, fare, ticket, timetable, delay, rush, commute, commuter, toll, horn
  `),
  "weather-nature": list(`
    weather, climate, season, spring, summer, autumn, fall, winter, sun, sunny, sunshine, rain,
    rainy, cloud, cloudy, wind, windy, storm, stormy, thunder, lightning, snow, snowy, ice, frost,
    fog, foggy, mist, hail, rainbow, temperature, degree, hot, warm, cool, cold, freezing, humid,
    dry, wet, typhoon, hurricane, tornado, flood, drought, earthquake, volcano, tsunami,
    forecast, nature, natural, environment, earth, sky, air, sea, ocean, river, stream, lake,
    pond, waterfall, mountain, hill, valley, cave, forest, jungle, wood, tree, leaf, branch,
    root, flower, grass, plant, bush, rock, stone, sand, soil, desert, island, beach, coast,
    field, moon, star, planet, sunrise, sunset, dawn, dusk, pollution, recycle, protect,
    wildlife, global, warming, oxygen, breeze, shade, shadow, drizzle, shower, heat, chilly
  `),
  animals: list(`
    animal, pet, dog, puppy, cat, kitten, mouse, rat, rabbit, hamster, bird, parrot, chicken, hen,
    cock, rooster, duck, goose, pigeon, eagle, owl, crow, sparrow, swan, penguin, ostrich,
    peacock, cow, ox, buffalo, bull, calf, horse, pony, donkey, pig, sheep, lamb, goat, deer,
    camel, elephant, lion, tiger, leopard, bear, wolf, fox, monkey, gorilla, giraffe, zebra,
    kangaroo, koala, panda, hippopotamus, rhinoceros, squirrel, bat, snake, lizard, crocodile,
    frog, toad, turtle, tortoise, fish, shark, whale, dolphin, octopus, crab, shrimp, jellyfish,
    insect, ant, bee, butterfly, moth, fly, mosquito, spider, cockroach, worm, snail, beetle,
    grasshopper, dragonfly, zoo, farm, cage, nest, feather, wing, tail, fur, paw, claw, horn,
    beak, hoof, feed, bark, wild, tame, hunt, prey
  `),
  "sports-hobbies": list(`
    sport, football, soccer, basketball, volleyball, tennis, badminton, golf, baseball, cricket,
    rugby, hockey, swimming, swim, run, running, jog, jogging, cycling, boxing, wrestling,
    karate, judo, yoga, gymnastics, athletics, marathon, race, ski, skiing, skate, skating, surf,
    surfing, dive, diving, fishing, climb, climbing, hiking, chess, cards, game, play, player,
    team, coach, referee, captain, match, competition, tournament, championship, champion, win,
    lose, draw, score, goal, point, medal, trophy, prize, ball, racket, net, bat, stadium, court,
    pitch, field, gym, training, exercise, fan, spectator, hobby, interest, leisure, collect,
    collection, stamp, painting, paint, drawing, photography, gardening, cooking, reading,
    knitting, sewing, dance, dancing, sing, singing, puzzle, crossword, toy, kite, doll, camping,
    picnic, amateur, professional
  `),
  "music-film": list(`
    music, musical, musician, song, singer, sing, band, concert, album, record, track, lyrics,
    melody, rhythm, tune, note, beat, pop, rock, jazz, classical, folk, rap, orchestra, choir,
    composer, compose, conductor, instrument, guitar, piano, violin, drum, flute, trumpet,
    saxophone, harp, cello, microphone, speaker, headphones, radio, stage, audience, perform,
    performance, performer, show, film, movie, cinema, theatre, theater, actor, actress,
    director, producer, star, celebrity, hero, heroine, villain, character, role, scene, script,
    plot, comedy, drama, horror, thriller, cartoon, animation, documentary, romance, action,
    fiction, sequel, premiere, trailer, ticket, screen, subtitle, review, critic, award, famous,
    entertainment, television, channel, programme, program, series, episode, dance, dancer,
    ballet, opera, festival, play, rehearse, rehearsal, applause, clap, fan
  `),
  "technology-life": list(`
    technology, computer, laptop, keyboard, mouse, screen, monitor, printer, scanner, software,
    hardware, program, application, internet, website, web, online, offline, e-mail, email,
    password, account, download, upload, file, folder, document, data, information, network,
    wireless, signal, battery, charger, charge, cable, plug, phone, telephone, mobile,
    smartphone, camera, video, digital, electronic, electric, electricity, device, gadget,
    machine, robot, calculator, television, remote, speaker, headphones, microphone, disk, disc,
    memory, chip, processor, virus, hacker, code, programmer, engineer, technician, invent,
    invention, inventor, innovation, science, scientist, research, experiment, laboratory,
    modern, automatic, update, install, delete, save, copy, paste, print, click, type, search,
    browse, connect, connection, message, text, call, dial, satellite, radio, button, switch,
    user, system, cursor, icon, browser, laser, antenna, telescope, microscope, keypad, modem,
    printout
  `),
  "time-numbers": list(`
    time, clock, watch, hour, minute, second, moment, day, week, month, year, decade, century,
    morning, afternoon, evening, night, midnight, noon, midday, today, tomorrow, yesterday,
    weekend, weekday, monday, tuesday, wednesday, thursday, friday, saturday, sunday, january,
    february, march, april, may, june, july, august, september, october, november, december,
    early, late, past, present, future, date, calendar, schedule, always, usually, often,
    sometimes, rarely, never, ago, soon, now, then, before, after, during, until, since, number,
    zero, one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen,
    fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty, thirty, forty, fifty,
    sixty, seventy, eighty, ninety, hundred, thousand, million, billion, first, third, half,
    quarter, double, dozen, plus, minus, total, count, percent
  `),
  emotions: list(`
    emotion, feeling, feel, happy, happiness, glad, joy, joyful, delighted, pleased, cheerful,
    excited, excitement, sad, sadness, unhappy, upset, depressed, miserable, cry, tear, angry,
    anger, annoyed, furious, mad, irritated, afraid, scared, frightened, fear, terrified,
    nervous, anxious, anxiety, worried, worry, stress, calm, relaxed, relief, relieved,
    surprised, surprise, shocked, shock, amazed, confused, embarrassed, ashamed, shame, guilty,
    guilt, proud, pride, jealous, envy, lonely, bored, boredom, tired, hopeful, hope, hopeless,
    disappointed, disappointment, satisfied, satisfaction, grateful, thankful, love, hate,
    like, dislike, enjoy, fond, passion, mood, emotional, smile, laugh, frown, sigh, scream,
    shy, curious, confident, regret, sorry, sympathy, pity, comfort, peaceful, content,
    homesick, nostalgia, panic, courage, brave, tense, desperate, eager, enthusiastic, delight,
    grief, sorrow, rage, cheer, terror
  `),
  "daily-communication": list(`
    hello, hi, goodbye, bye, please, thank, thanks, sorry, excuse, pardon, welcome, yes, no,
    okay, sure, maybe, perhaps, agree, disagree, ask, answer, reply, question, say, tell, speak,
    talk, chat, call, phone, message, meet, greet, introduce, name, address, help, need, want,
    wish, hope, think, know, understand, mean, explain, repeat, spell, describe, suggest,
    suggestion, advice, recommend, offer, accept, refuse, invite, request, order, allow,
    permission, promise, apologize, apologise, congratulate, congratulation, cheers, wow, oh,
    well, really, actually, honestly, definitely, exactly, probably, certainly, absolutely, fine,
    great, good, bad, nice, terrible, wonderful, polite, conversation, discuss, discussion,
    opinion, idea, news, information, problem, trouble, matter, mind, care, listen, hear, look,
    see, watch, wait, hurry, stop, come, go, sit, stand, open, close, give, take, bring, show
  `),
};

/** Cốt lõi trước, mở rộng sau; bỏ từ trùng (giữ vị trí xuất hiện đầu tiên). */
export const TOPIC_WORDS = {} as Record<LifeTopic, readonly string[]>;
for (const topic of LIFE_TOPICS) {
  TOPIC_WORDS[topic] = [...new Set([...CORE_TOPIC_WORDS[topic], ...MORE_TOPIC_WORDS[topic]])];
}
