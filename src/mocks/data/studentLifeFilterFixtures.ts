import type { Comment, HousingPost, KnowledgePost, StudentExperience } from "@/types/entities";
import { CAMPUS_AREAS } from "@/lib/campusAreas";
import { currentLifeDate, currentLifeYear, EXPERIENCE_CATEGORIES, EXPERIENCE_INTENTS, HOUSING_AMENITIES, HOUSING_KINDS } from "@/lib/studentLifeDetails";
import { LIFE_TOPICS } from "@/lib/studentLife";
import { demoAttachment } from "./studentLifeDemoResources";

// Illustrative anchors for radius tests, not verified restaurant/campus pins.
export const DEMO_CAMPUS_LOCATIONS: Record<string, { latitude: number; longitude: number }> = {
  "Hòa Lạc": { latitude: 21.013, longitude: 105.526 },
  "TP. Hồ Chí Minh": { latitude: 10.841, longitude: 106.810 },
  "Đà Nẵng": { latitude: 15.975, longitude: 108.253 },
  "Cần Thơ": { latitude: 10.014, longitude: 105.733 },
  "Quy Nhơn": { latitude: 13.795, longitude: 109.217 },
};
const gateways: Record<string, string> = {
  "Hòa Lạc": "Mỹ Đình", "TP. Hồ Chí Minh": "Suối Tiên", "Đà Nẵng": "Bến xe trung tâm Đà Nẵng",
  "Cần Thơ": "Bến Ninh Kiều", "Quy Nhơn": "Trung tâm Quy Nhơn",
};
const authors = ["usr_student_01", "usr_student_02", "usr_student_03", "usr_student_07", "usr_student_08", "usr_student_09", "usr_student_10", "usr_student_11", "usr_student_12"];
const housingOpeners: Record<HousingPost["kind"], string> = {
  seeking: "Tìm phòng", roommate: "Tìm người ở ghép", transfer: "Nhượng phòng", experience: "Chia sẻ chuyện ở trọ",
};
const advice: Record<StudentExperience["category"], string> = {
  ojt: "Mình gom CV, mô tả dự án và lịch ứng tuyển trước khi bắt đầu OJT. Cách ghi nhật ký công việc của mọi người thế nào?",
  graduation: "Nhóm mình đang rà lại phạm vi đồ án tốt nghiệp, chia phần demo và chuẩn bị hỏi đáp. Mọi người có checklist nào dễ áp dụng không?",
  materials: "Mình đang hệ thống lại các phần đã học và tìm bài tập tự luyện. Mong mọi người chia sẻ tài liệu được phép sử dụng, không cần đề thi hay đáp án.",
  career: "Mình muốn mô tả rõ phần việc đã làm trong CV và chuẩn bị ví dụ để trao đổi khi phỏng vấn. Xin góp ý cách trình bày ngắn gọn.",
  procedures: "Mình đang tổng hợp các bước hỏi xác nhận sinh viên và đầu mối liên hệ. Ai đã làm rồi chia sẻ kinh nghiệm kiểm tra thời hạn giúp mình nhé.",
  other: "Thử chia việc theo tuần và ghi lại chi tiêu giúp mình chủ động hơn. Mọi người thường duy trì lịch học, nghỉ ngơi và sinh hoạt thế nào?",
};

export function createStudentLifeFilterFixtures(now = new Date()) {
  const posts: KnowledgePost[] = [];
  const comments: Comment[] = [];
  const savedIds: string[] = [];
  const year = currentLifeYear(now);
  const dateCache = new Map<number, string>();
  const dateAt = (offset: number) => {
    if (!dateCache.has(offset)) dateCache.set(offset, currentLifeDate(offset, now));
    return dateCache.get(offset)!;
  };
  const currentMonth = Number(dateAt(0).slice(5, 7));
  let sequence = 0;

  function add(id: string, campus: string, area: string, values: Partial<KnowledgePost>, replies = 0) {
    const index = sequence++;
    const createdAt = new Date(now.getTime() - (180 + (index * 19) % 36000) * 60000).toISOString();
    const entry: KnowledgePost = {
      id: `life_demo_${id}`, authorId: authors[index % authors.length], campus, area,
      type: "discussion", title: "", contentMd: "", tags: [], attachments: [],
      status: "Published", visibility: "cross_school", likesCount: (index * 13) % 97,
      commentCount: replies, createdAt, updatedAt: createdAt,
      demoContent: { kind: "synthetic", note: "Dữ liệu mô phỏng để thử bộ lọc. Nhân vật, phòng, quán, mức giá và vị trí là ví dụ; không phải tin chào thuê hay thông tin địa điểm đã xác minh." },
      ...values,
    };
    posts.push(entry);
    for (let reply = 0; reply < replies; reply++) {
      comments.push({
        id: `${entry.id}_comment_${reply}`, postId: entry.id,
        authorId: authors[(index + reply + 1) % authors.length],
        content: entry.lifeTopic === "food" ? ["Mình cũng muốn thử món này, cảm ơn bạn chia sẻ mức giá.", "Bạn ghi rõ chi phí nên mình dễ cân đối bữa ăn hơn.", "Mình lưu lại để rủ bạn đi cùng."][reply % 3] : "Bạn thử đối chiếu với hướng dẫn mới nhất của cơ sở rồi trao đổi thêm với người phụ trách nhé. Mình gửi thêm ghi chú để bạn tham khảo.",
        likesCount: reply % 4,
        createdAt: new Date(Date.parse(createdAt) + (reply + 1) * 60000).toISOString(),
        isAcceptedAnswer: entry.isSolved && reply === 0,
      });
    }
    if (entry.isSolved && replies) entry.acceptedCommentId = `${entry.id}_comment_0`;
    return entry;
  }

  Object.entries(CAMPUS_AREAS).forEach(([campus, areas], campusIndex) => {
    areas.forEach((area, areaIndex) => {
      const key = `${campusIndex}_${areaIndex}`;
      const shortArea = area.replace(/^(Xã|Phường) /, "").replace(" (khu vực cũ)", "");
      const reference = add(`housing_experience_${key}`, campus, area, {
        lifeTopic: "housing", type: "experience", title: `Ở ${shortArea}: các khoản mình hỏi trước khi chuyển vào`,
        contentMd: "Lúc đi xem trọ mình hỏi cả tiền phòng, điện, nước và phí dịch vụ. Hai nơi cùng giá thuê vẫn có thể khác tổng cuối tháng. Bạn nào đang tìm phòng nhớ đối chiếu từng khoản nhé.",
        housingPost: { kind: "experience" },
        housingExperience: { monthlyCost: 1700000 + areaIndex * 50000, duration: "3 tháng", highlights: "Chủ động giờ giấc, thuận tiện chia việc với bạn cùng phòng.", considerations: "Cần hỏi rõ các khoản ngoài tiền phòng." },
      });
      savedIds.push(reference.id);
      add(`housing_question_${key}`, campus, area, {
        lifeTopic: "housing", type: "question", title: `Khi tìm trọ ở ${shortArea}, mọi người hỏi trước những gì?`,
        contentMd: "Mình đang ghi các câu hỏi để đi xem trọ, đặc biệt là giờ giấc, tiền cọc và cách chia điện nước. Xin kinh nghiệm của mọi người.", housingPost: { kind: "experience" }, isSolved: false,
      });

      // Full discrete matrix: region × intent × people × month. A low-budget
      // open sample with all amenities makes every checkbox combination testable.
      HOUSING_KINDS.filter((kind) => kind.value !== "experience").forEach(({ value: kind }) => {
        for (let people = 1; people <= 4; people++) {
          for (let month = 1; month <= 12; month++) {
            const price = [750000, 800000, 900000, 950000][(areaIndex + month + people) % 4];
            const entry = add(`housing_${key}_${kind}_${people}_${month}`, campus, area, {
              lifeTopic: "housing", title: `${housingOpeners[kind]} ở ${shortArea} · ${people} người · tháng ${month}`,
              contentMd: `${kind === "seeking" ? "Mình đang tìm chỗ ở" : "Mình chia sẻ mẫu tin chỗ ở"} cho ${people} người tại ${shortArea}. Mức tiền ghi theo người mỗi tháng, chưa gồm các khoản dùng theo thực tế. Muốn trao đổi thêm thì bình luận ngay dưới bài nhé. Đây là tình huống demo để thử lựa chọn tháng và tiện ích.`,
              housingPost: {
                kind, area, people, price, priceUnit: "person", closed: false,
                availableFrom: `${year}-${String(month).padStart(2, "0")}-${String([1, 10, 20, 28][people - 1]).padStart(2, "0")}`,
                amenities: [...HOUSING_AMENITIES],
                ...(kind === "seeking" ? {} : { deposit: price, electricity: "3.500đ/kWh (minh họa)", water: "70.000đ/người/tháng (minh họa)", serviceFee: 100000 }),
              },
            });
            if (people === 2 && month === currentMonth) savedIds.push(entry.id);
          }
        }
        [1500000, 2500000, 4500000].forEach((price, tier) => {
          add(`housing_price_${key}_${kind}_${tier}`, campus, area, {
            lifeTopic: "housing", title: `${housingOpeners[kind]} tại ${shortArea} · ${price / 1000000} triệu/phòng`,
            contentMd: "Mẫu tin có giá theo phòng để so sánh với các bài ghi giá theo người. Tổng tiền cần xem thêm điện, nước, tiền cọc và dịch vụ.",
            housingPost: { kind, area, price, priceUnit: "room", people: 2, availableFrom: dateAt(1), closed: false, amenities: HOUSING_AMENITIES.slice(0, tier + 2) },
          });
        });
        add(`housing_closed_${key}_${kind}`, campus, area, {
          lifeTopic: "housing", title: `${housingOpeners[kind]} ở ${shortArea} — đã kết thúc`,
          contentMd: "Mẫu tin đã tìm được phòng hoặc đủ người. Bật “Chỉ hiện tin còn phòng / còn tìm” để ẩn bài này.",
          housingPost: { kind, area, price: 950000, priceUnit: "person", people: 2, availableFrom: dateAt(0), closed: true, amenities: [...HOUSING_AMENITIES] },
        });
      });

      EXPERIENCE_CATEGORIES.forEach(({ value: category, label }) => {
        EXPERIENCE_INTENTS.forEach(({ value: intent, label: intentLabel }) => {
          const courseCodes = category === "materials" ? ["PRJ301", "CSD201", "MAS291"] : [undefined];
          courseCodes.forEach((courseCode) => {
            [false, true].forEach((withFile) => {
              const question = intent !== "sharing";
              const entry = add(`experience_${key}_${category}_${intent}_${courseCode || "general"}_${Number(withFile)}`, campus, area, {
                lifeTopic: "experience", type: question ? "question" : withFile ? "document" : "experience",
                title: `${label}${courseCode ? ` · ${courseCode}` : ""}: ${intentLabel.toLowerCase()}${withFile ? " kèm ghi chú" : ""}`,
                contentMd: advice[category] + (intent === "request_materials" ? "\n\nMình muốn xin thêm tài liệu để tự học; nếu có thể chia sẻ công khai thì gửi giúp mình ở phần bình luận nhé." : ""),
                studentExperience: { category, intent, courseCode },
                attachments: withFile ? [demoAttachment(category)] : [],
                isSolved: question && withFile,
              }, withFile ? 1 : 0);
              savedIds.push(entry.id);
            });
          });
        });
      });

      const dishes = ["Bánh mì trứng", "Cơm gà", "Bún bò", "Lẩu phần nhỏ"];
      [25000, 45000, 65000, 95000].forEach((price, priceIndex) => {
        [0.3, 2, 4.5, 7].forEach((distance, distanceIndex) => {
          const anchor = DEMO_CAMPUS_LOCATIONS[campus];
          const entry = add(`food_${key}_${priceIndex}_${distanceIndex}`, campus, area, {
            lifeTopic: "food", type: "review", title: `${dishes[priceIndex]} ${price / 1000}k/người ở ${shortArea}`,
            contentMd: `Mình ghi lại một gợi ý ${dishes[priceIndex].toLowerCase()} trong tầm ${price / 1000}k mỗi người để mọi người dễ chọn bữa. Mức giá, quán và tọa độ trong bài đều được tạo cho demo; không dùng để tìm đường đến một quán thật.`,
            foodReview: {
              placeName: `Bếp ${shortArea} ${priceIndex + 1}-${distanceIndex + 1} (demo)`, dish: dishes[priceIndex], spentPerPerson: price,
              coordinates: { latitude: anchor.latitude + distance / 111.195, longitude: anchor.longitude },
              visitedOn: dateAt(-priceIndex), isDemo: true,
            },
            likesCount: [62, 35, 18, 4][priceIndex] + distanceIndex,
            location: `${shortArea} · vị trí mô phỏng`,
          }, [0, 1, 3, 6][distanceIndex]);
          savedIds.push(entry.id);
        });
      });
      add(`food_no_pin_${key}`, campus, area, {
        lifeTopic: "food", type: "review", title: `Một bữa cơm 35k ở ${shortArea}, chưa gắn vị trí`,
        contentMd: "Mình chia sẻ thêm lựa chọn ăn trưa nhưng chưa gắn vị trí quán. Bài vẫn xuất hiện khi lọc mức giá; bộ lọc Gần tôi chỉ hiển thị những bài có tọa độ.",
        foodReview: { placeName: `Bữa trưa ${shortArea} (demo)`, spentPerPerson: 35000, dish: "Cơm phần", isDemo: true },
      });

      [0, 1, 2, 7, 14].forEach((offset) => {
        (["seeking", "offering"] as const).forEach((kind) => {
          [false, true].forEach((returning) => {
            const gateway = `${gateways[campus]} · ${shortArea}`;
            const school = `Cổng FPT ${campus}`;
            const origin = returning ? school : gateway;
            const destination = returning ? gateway : school;
            const departure = `${dateAt(offset)}T${returning ? "17:30" : "06:30"}`;
            const entry = add(`ride_${key}_${offset}_${kind}_${Number(returning)}`, campus, area, {
              lifeTopic: "transport", title: `${kind === "offering" ? "Có xe, còn chỗ" : "Cần ghép chuyến"}: ${origin} → ${destination}`,
              contentMd: `Mình ${kind === "offering" ? "còn chỗ và muốn tìm bạn đi cùng" : "cần tìm bạn cùng chuyến"}. Dự kiến đi lúc ${returning ? "17h30" : "6h30"}; cùng chốt điểm đón công cộng và phần góp chi phí qua bình luận trước khi đi nhé. Đây là chuyến minh họa.`,
              ridePost: { kind, origin, destination, departure, seats: kind === "offering" ? 1 : 2, contribution: 20000 + campusIndex * 5000 },
            });
            if (offset < 2) savedIds.push(entry.id);
          });
        });
      });

      (["campus", "conversation"] as const).forEach((topic) => {
        for (let variant = 0; variant < 3; variant++) {
          const question = variant !== 0;
          const entry = add(`${topic}_${key}_${variant}`, campus, area, {
            lifeTopic: topic, type: question ? "question" : "discussion",
            title: topic === "campus" ? [ `Một góc yên tĩnh để đọc sách ở ${shortArea}`, `Quanh ${shortArea} có chỗ học chung nào dễ ngồi?`, `Mình đã tìm được góc nghỉ giữa hai ca ở ${shortArea}` ][variant] : [ `Một chuyện vui nhỏ hôm nay ở ${campus}`, "Làm sao để chủ động bắt chuyện với bạn mới?", "Cảm ơn người bạn đã rủ mình đi ăn cùng" ][variant],
            contentMd: topic === "campus" ? "Mình muốn đổi không gian sau giờ học, tìm một góc sáng và không quá ồn để đọc sách. Bạn nào biết chỗ phù hợp trong khu vực chia sẻ giúp mình nhé." : "Có những ngày chỉ một lời rủ đi ăn cũng khiến mình thấy dễ hòa nhập hơn. Mình chia sẻ câu chuyện nhỏ và muốn nghe cách mọi người kết nối với bạn mới.",
            isSolved: variant === 2,
          }, variant === 2 ? 1 : 0);
          savedIds.push(entry.id);
        }
      });
    });

    // Own-post status tabs contain all topics at every campus.
    LIFE_TOPICS.forEach(({ value: topic, label }) => {
      (["Published", "PendingReview", "Rejected"] as const).forEach((status) => {
        add(`mine_${campusIndex}_${topic}_${status}`, campus, areas[0], {
          lifeTopic: topic, authorId: "usr_student_01", status, visibility: "school",
          title: `${label}: ghi chú của mình tại ${campus}`,
          contentMd: "Mình đang tổng hợp ghi chú để chia sẻ với cộng đồng. Bài mẫu này dùng kiểm tra các trạng thái đăng bài của tài khoản demo.",
          rejectReason: status === "Rejected" ? "Mẫu cần bổ sung thông tin trước khi đăng lại." : undefined,
        });
      });
    });
  });
  return { posts, comments, savedIds: [...new Set(savedIds)] };
}
