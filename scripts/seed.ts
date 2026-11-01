import { ObjectId, type Db } from "mongodb";
import { run, withDb } from "./connect";

// Dữ liệu mẫu cho dev/staging. Idempotent: chạy lại chỉ cập nhật theo `word`, không nhân đôi.

type W = [word: string, meaningVi: string, ipa: string, example: string];

const WORDS: W[] = [
  ["mother", "mẹ", "/ˈmʌð.ər/", "My mother is a teacher."],
  ["father", "bố", "/ˈfɑː.ðər/", "My father cooks dinner every Sunday."],
  ["sister", "chị/em gái", "/ˈsɪs.tər/", "I have one younger sister."],
  ["brother", "anh/em trai", "/ˈbrʌð.ər/", "His brother lives in Hanoi."],
  ["grandmother", "bà", "/ˈɡræn.mʌð.ər/", "We visit our grandmother at Tet."],
  ["cousin", "anh chị em họ", "/ˈkʌz.ən/", "My cousin is the same age as me."],
  ["husband", "chồng", "/ˈhʌz.bənd/", "Her husband works at a bank."],
  ["wife", "vợ", "/waɪf/", "He met his wife at university."],
  ["rice", "cơm, gạo", "/raɪs/", "We eat rice with every meal."],
  ["noodle", "mì, sợi bún/phở", "/ˈnuː.dəl/", "Pho is a kind of noodle soup."],
  ["egg", "trứng", "/eɡ/", "I had two eggs for breakfast."],
  ["chicken", "thịt gà, con gà", "/ˈtʃɪk.ɪn/", "Grilled chicken is my favourite."],
  ["vegetable", "rau củ", "/ˈvedʒ.tə.bəl/", "Eat more vegetables."],
  ["fruit", "trái cây", "/fruːt/", "Mango is a tropical fruit."],
  ["bread", "bánh mì", "/bred/", "She buys fresh bread every morning."],
  ["water", "nước", "/ˈwɔː.tər/", "Drink a glass of water."],
  ["red", "màu đỏ", "/red/", "The flag is red and yellow."],
  ["blue", "màu xanh dương", "/bluː/", "The sky is blue today."],
  ["green", "màu xanh lá", "/ɡriːn/", "Rice fields are green in spring."],
  ["yellow", "màu vàng", "/ˈjel.əʊ/", "Bananas turn yellow when ripe."],
  ["black", "màu đen", "/blæk/", "He wears a black jacket."],
  ["white", "màu trắng", "/waɪt/", "Snow is white."],
  ["passport", "hộ chiếu", "/ˈpɑːs.pɔːt/", "Please show your passport."],
  ["boarding pass", "thẻ lên máy bay", "/ˈbɔː.dɪŋ ˌpɑːs/", "Keep your boarding pass ready."],
  ["luggage", "hành lý", "/ˈlʌɡ.ɪdʒ/", "My luggage is too heavy."],
  ["departure", "chuyến đi, khởi hành", "/dɪˈpɑː.tʃər/", "Check the departure board."],
  ["arrival", "chuyến đến", "/əˈraɪ.vəl/", "The arrival hall is downstairs."],
  ["delay", "sự chậm trễ", "/dɪˈleɪ/", "There is a two-hour delay."],
  ["reservation", "đặt chỗ trước", "/ˌrez.əˈveɪ.ʃən/", "I have a reservation for two nights."],
  ["receptionist", "lễ tân", "/rɪˈsep.ʃən.ɪst/", "Ask the receptionist for a map."],
  ["key card", "thẻ phòng", "/ˈkiː ˌkɑːd/", "My key card doesn't work."],
  ["check out", "trả phòng", "/ˈtʃek aʊt/", "We check out at noon."],
  ["towel", "khăn tắm", "/ˈtaʊ.əl/", "Could I have an extra towel?"],
  ["breakfast", "bữa sáng", "/ˈbrek.fəst/", "Breakfast is served until 10 a.m."],
];

async function seed(db: Db) {
  const now = new Date();
  for (const [word, meaningVi, ipa, example] of WORDS) {
    await db.collection("words").updateOne(
      { word },
      {
        $set: { meaningVi, ipa, example, status: "published", updatedAt: now },
        $setOnInsert: { _id: new ObjectId(), topic: "general", createdAt: now },
      },
      { upsert: true },
    );
  }
  console.log(`Đã seed ${WORDS.length} từ.`);
}

run(async () => {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Không chạy seed ở production.");
  }
  await withDb(seed);
});
