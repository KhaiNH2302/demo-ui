import type { Comment, KnowledgePost } from "@/types/entities";

const ago = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();
const post = (
  number: number,
  values: Partial<KnowledgePost>,
): KnowledgePost => ({
  id: `post_${String(number).padStart(2, "0")}`,
  authorId: "usr_student_02",
  type: "discussion",
  contentMd: "",
  tags: [],
  attachments: [],
  visibility: "cross_school",
  status: "Published",
  campus: "Hòa Lạc",
  likesCount: 0,
  commentCount: 0,
  createdAt: ago(number * 45),
  updatedAt: ago(number * 45),
  demoContent: {},
  ...values,
});

export const seedKnowledgePosts: KnowledgePost[] = [
  post(14, {
    authorId: "usr_student_03",
    lifeTopic: "food",
    type: "review",
    createdAt: ago(18),
    title: "Bánh mì que Highlands 19k, ăn lót dạ giữa hai ca được không mn?",
    contentMd:
      "Mình đang tìm đồ ăn gọn để mang theo giữa hai ca. Xem menu Highlands thấy bánh mì que pate 19k một cái, còn loại gà phô mai cũng cùng giá.\n\nBạn nào hay mua món này rồi cho mình hỏi một cái có đủ lót dạ không, hay nên chuẩn bị thêm đồ ăn? Mình chỉ tính phần bánh thôi, gọi thêm nước nữa là dễ quá budget sáng :))",
    location: "Hà Nội · tham khảo menu chuỗi",
    tags: ["ĂnGiữaCa", "19k"],
    likesCount: 28,
    foodReview: {
      placeName: "Highlands Coffee",
      dish: "Bánh mì que pate",
      spentPerPerson: 19000,
      rating: 0,
      isDemo: true,
    },
    demoContent: {
      note: "Tên quán, món và giá lấy từ menu công khai. Bài được biên soạn cho demo, không phải trải nghiệm đã xác minh.",
      sources: [
        {
          label: "Menu Highlands Coffee",
          url: "https://www.highlandscoffee.com.vn/vn/banh-mi-que.html",
        },
      ],
    },
  }),

  post(1, {
    authorId: "usr_student_03",
    lifeTopic: "housing",
    type: "experience",
    title: "Đi xem trọ nhớ hỏi tiền mạng nữa mn ơi 🥲",
    contentMd:
      "Ở trọ được 3 tháng mới thấy tiền phòng chưa phải cả khoản phải đóng. Lúc xem mình chỉ hỏi tiền thuê, về ở mới cộng thêm điện, nước, mạng rồi gửi xe.\n\nGiờ có bạn sắp ra ngoài hỏi kinh nghiệm, mình bảo xin một bảng các khoản trước đã. Hai phòng cùng tiền thuê mà tổng cuối tháng có thể khác nhau kha khá. Mn còn khoản nào dễ quên khi đi xem trọ không?",
    location: "Quanh campus Hòa Lạc",
    housingExperience: {
      monthlyCost: 2100000,
      duration: "3 tháng, kỳ này",
      highlights: "Đi học tầm 10 phút, có bếp để tự nấu với bạn cùng phòng.",
      considerations:
        "Chi phí ngoài tiền phòng khá nhiều; buổi tối đôi lúc có tiếng hát từ quán gần đó.",
    },
    demoContent: {
      sources: [
        {
          label: "Thảo luận VOZ về chi phí ở trọ",
          url: "https://voz.vn/t/gia-dien-nuoc-o-tro-cua-cac-thim-bao-nhieu.934708/",
        },
      ],
    },
    tags: ["ỞTrọ"],
    likesCount: 36,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80",
    ],
  }),
  post(15, {
    authorId: "usr_student_02",
    lifeTopic: "food",
    type: "review",
    createdAt: ago(70),
    title: "Tầm 40k ăn cơm sườn Phúc Lộc Thọ, mn thường gọi thêm gì?",
    contentMd:
      "Mình đang gom vài lựa chọn ăn trưa để đỡ hôm nào tới giờ mới nghĩ. Trên trang Phúc Lộc Thọ có phần cơm sườn, mốc giá mình dùng để tính là 39k, chưa tính món thêm hay phí giao.\n\nAi hay ăn cơm tấm cho mình xin cách gọi trong khoảng 40–50k với. Nếu đi hai đứa thì gọi riêng từng phần hay thêm món chung sẽ tiện hơn? Mình muốn ăn đủ một bữa chứ không phải thấy khuyến mãi là đặt cả đống 🥲",
    campus: "TP. Hồ Chí Minh",
    location: "TP. Hồ Chí Minh · tham khảo menu chuỗi",
    tags: ["CơmTrưa", "Budget50k"],
    likesCount: 19,
    foodReview: {
      placeName: "Cơm Tấm Phúc Lộc Thọ",
      dish: "Cơm sườn",
      spentPerPerson: 39000,
      rating: 0,
      isDemo: true,
    },
    demoContent: {
      note: "Dùng mốc giá tham khảo trong nguồn, không tính giá ưu đãi. Nội dung là tình huống demo; giá thực tế tùy thời điểm và nơi mua.",
      sources: [
        {
          label: "Menu Phúc Lộc Thọ",
          url: "https://comtamphucloctho.vn/collections/hot-products?view=amp",
        },
      ],
    },
  }),

  post(2, {
    authorId: "usr_student_01",
    lifeTopic: "food",
    type: "question",
    title: "Tối ở ktx mn hay ăn gì ngoài mì tôm vậy?",
    contentMd:
      "Mình ở ktx được 2 tuần mà cứ cơm rồi mì, sắp bí món thật sự. Có hôm học về muộn muốn ăn gì gọn gọn, budget tầm 30–40k thôi.\n\nMn hay mua ở đâu hoặc chuẩn bị sẵn món gì vậy? Xin mấy lựa chọn ăn được thường xuyên chứ tuần nào cũng trà sữa thì ví mình chịu không nổi 😭",
    location: "Ký túc xá",
    demoContent: {
      sources: [
        {
          label: "Thảo luận về tự nấu và ăn ngoài",
          url: "https://www.reddit.com/r/vozforums/comments/1jje5r7/",
        },
      ],
    },
    tags: ["ĂnTối", "KTX"],
    likesCount: 12,
    isSolved: true,
    acceptedCommentId: "cmt_02",
  }),
  post(3, {
    authorId: "usr_student_07",
    lifeTopic: "transport",
    type: "discussion",
    title: "Mai có ai từ Mỹ Đình lên Hòa Lạc ca 1 không?",
    contentMd:
      "Mai mình cần lên trường học ca 1, muốn tìm bạn có xe đi cùng đường. Mình ở khu Mỹ Đình, có thể ra điểm hẹn khoảng 6h15–6h30.\n\nMình góp tiền xăng nha, ai còn chỗ thì nhắn mình chốt giờ với điểm đón. Nếu hợp lịch thì mấy buổi sau đi chung luôn cho đỡ cảnh sáng nào cũng cuống :))",
    location: "Mỹ Đình → campus Hòa Lạc",
    tags: ["GhépXe", "Ca1"],
    likesCount: 5,
  }),
  post(4, {
    authorId: "usr_student_02",
    lifeTopic: "food",
    type: "discussion",
    title: "Bữa đầu tự nấu của 2 đứa ở ghép, nhìn cũng ra gì phết :))",
    contentMd:
      "Đi chợ hết 78k cho hai đứa, còn dư rau để mai ăn tiếp. Đứa rửa rau, đứa đứng bếp, cơm suýt sống nhưng cứu kịp.\n\nĂn xong mới nhớ không ai muốn rửa bát. Mn có món nào làm một chảo là xong không, giới thiệu tụi mình với.",
    demoContent: {
      sources: [
        {
          label: "Thảo luận về đi chợ và chia khẩu phần",
          url: "https://www.reddit.com/r/vozforums/comments/1jje5r7/",
        },
      ],
    },
    tags: ["BếpNhà", "ỞGhép"],
    likesCount: 24,
    images: [
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=80",
    ],
  }),
  post(16, {
    authorId: "usr_student_09",
    lifeTopic: "food",
    type: "review",
    createdAt: ago(200),
    title: "Bạc xỉu ở Cộng 45k, xin ít gợi ý cho buổi ngồi với nhóm",
    contentMd:
      "Cuối tuần nhóm mình tính hẹn nhau ở quán cà phê để chốt slide. Mình xem menu Cộng thì bạc xỉu niêm yết 45k, nên đang tính mỗi đứa tự chọn nước trong tầm đó.\n\nBạn nào từng ngồi làm bài ở Cộng tại Đà Nẵng rồi cho mình hỏi nên ghé khung giờ nào với? Nhóm 3 đứa thôi, chỉ cần nói chuyện được và có chỗ cắm laptop. Mình chưa chốt chi nhánh nên xin trải nghiệm của mn trước nha.",
    campus: "Đà Nẵng",
    location: "Đà Nẵng · chưa chốt chi nhánh",
    tags: ["NgồiCùngNhóm", "CàPhê"],
    likesCount: 16,
    foodReview: {
      placeName: "Cộng Cà Phê",
      dish: "Bạc xỉu",
      spentPerPerson: 45000,
      rating: 0,
      isDemo: true,
    },
    demoContent: {
      note: "Tên quán và giá từ menu Cộng; nhu cầu hẹn nhóm là tình huống biên soạn. Chưa xác minh ổ cắm, chỗ ngồi hoặc chi nhánh cụ thể.",
      sources: [
        {
          label: "Menu bạc xỉu của Cộng",
          url: "https://congcaphe.com/product/5561/bac-xiu",
        },
      ],
    },
  }),

  post(5, {
    authorId: "usr_student_08",
    lifeTopic: "campus",
    type: "question",
    title: "Cuối tuần quanh trường có chỗ nào ngồi yên yên không?",
    contentMd:
      "Muốn mang quyển sách ra đọc đổi gió một buổi. Chỉ cần có bóng mát, ngồi không bị giục, đi bộ được thì càng tốt ạ.\n\nQuán nước cũng được nhưng xin chỗ giá mềm mềm, cuối tháng rồi 🥲",
    campus: "Đà Nẵng",
    location: "Quanh campus Đà Nẵng",
    tags: ["GócYênTĩnh"],
    likesCount: 8,
  }),
  post(6, {
    authorId: "usr_student_09",
    lifeTopic: "experience",
    type: "experience",
    title: "Ghi chi tiêu mới biết tiền mình đi đâu mất",
    contentMd:
      "Mình tưởng mình tiêu ít, đến khi mở lịch sử đặt đồ uống ra mới im luôn =))\n\nTháng này thử ghi từng khoản vào note điện thoại thôi, không làm bảng gì cầu kỳ. Mới 10 ngày mà đỡ mấy đơn freeship nhưng tiền món vẫn cao. Mn có cách nào ghi mà không bỏ giữa chừng không?",
    tags: ["CuốiTháng", "ChiTiêu"],
    likesCount: 19,
  }),
  post(7, {
    authorId: "usr_newbie_08",
    lifeTopic: "conversation",
    type: "discussion",
    title: "Hết tiết là ai về phòng nấy, mỗi mình thấy hơi lạc lõng à",
    contentMd:
      "Ở lớp mình vẫn nói chuyện bình thường, nhưng đến giờ ăn lại không biết rủ ai. Thấy mấy bạn quen nhau nhanh mà mình cứ ngại ngại.\n\nAnh chị hồi mới vào trường có vậy không ạ? Muốn rủ một bạn đi ăn mà nghĩ mãi chưa dám nhắn.",
    tags: ["NămNhất"],
    likesCount: 27,
  }),
  post(8, {
    authorId: "usr_student_10",
    lifeTopic: "housing",
    type: "question",
    title: "Ở ghép có nên nói chuyện giờ giấc từ đầu không?",
    contentMd:
      "Sắp thuê chung với một bạn, hai đứa chơi cũng ổn nhưng mình ngủ sớm còn bạn ấy hay thức. Mình muốn nói trước chuyện bật đèn với bạn tới chơi mà sợ bị nghĩ là khó tính.\n\nMn từng ở ghép rồi thường thống nhất kiểu gì cho đỡ ngại?",
    campus: "TP. Hồ Chí Minh",
    location: "Quanh campus TP. Hồ Chí Minh",
    demoContent: {
      sources: [
        {
          label: "Thảo luận của sinh viên về giờ giấc ở ghép",
          url: "https://www.reddit.com/r/vozforums/comments/1nswd26/",
        },
      ],
    },
    tags: ["ỞGhép"],
    likesCount: 10,
  }),
  post(17, {
    authorId: "usr_student_10",
    lifeTopic: "food",
    type: "review",
    createdAt: ago(390),
    title: "Bánh mì chả cá Má Hải 25k, ai hay mua ở Thành Thái không?",
    contentMd:
      "Mình lưu lại menu Bánh Mì Má Hải trên beFood để có thêm một lựa chọn ăn sáng. Chi nhánh Thành Thái đang hiển thị bánh mì chả cá 25k, thêm trứng thì thành 30k.\n\nBạn nào hay mua trực tiếp ở đây cho mình hỏi giá ở quầy có khác trên app không? Nếu chỉ gọi một ổ mà thêm phí ship thì hơi phí, mình đang tính tiện đường ghé lấy. Xin thêm ý kiến về khẩu phần từ người đã ăn với ạ.",
    campus: "TP. Hồ Chí Minh",
    location: "Thành Thái, TP. Hồ Chí Minh",
    tags: ["ĂnSáng", "Dưới30k"],
    likesCount: 11,
    foodReview: {
      placeName: "Bánh Mì Má Hải – Thành Thái",
      dish: "Bánh mì chả cá",
      spentPerPerson: 25000,
      rating: 0,
      isDemo: true,
    },
    demoContent: {
      note: "Món và giá tham khảo từ menu cửa hàng trên beFood, chưa gồm phí giao hàng. Bài được biên soạn cho demo.",
      sources: [
        {
          label: "Menu Má Hải – Thành Thái",
          url: "https://food.be.com.vn/ho-chi-minh/banh-mi-ma-hai-thanh-thai-16718",
        },
      ],
    },
  }),

  post(9, {
    authorId: "usr_student_11",
    lifeTopic: "campus",
    type: "discussion",
    title: "Hôm nay ngồi ngoài sân không làm gì mà thấy dễ chịu ghê",
    contentMd:
      "Hai đứa định về phòng làm tiếp bài mà ngồi tám linh tinh hết nửa tiếng. Không có gì đặc biệt, chỉ là lâu rồi mới thấy đầu nhẹ nhẹ như vậy.\n\nXin một chuyện vui bé xíu của mn tuần này đi.",
    campus: "Cần Thơ",
    tags: ["ChuyệnNhỏ"],
    likesCount: 17,
  }),
  post(10, {
    authorId: "usr_student_01",
    lifeTopic: "experience",
    type: "experience",
    title: "Vào ktx đừng vội mua đồ giống mình",
    contentMd:
      "Ngày đầu mang lên đủ thứ, tới nơi thấy bạn cùng phòng cũng mua y chang. Kết quả là phòng có 3 cái chậu với một đống móc áo =))\n\nMấy món dùng chung cứ hỏi nhau trước nha. Với mang đồ vừa đủ một tuần thôi, ở vài hôm biết mình thiếu gì rồi mua sau vẫn kịp.",
    location: "Ký túc xá",
    tags: ["KTX", "NămNhất"],
    likesCount: 21,
  }),
  post(11, {
    authorId: "usr_student_12",
    lifeTopic: "transport",
    type: "discussion",
    title: "Chiều nay về trung tâm, mình còn một chỗ nha",
    contentMd:
      "Mình tan học tầm 17h30, chạy xe từ campus về trung tâm Quy Nhơn. Bạn nào cùng đường thì đi chung cho vui, tiền xăng chia nhau là được.\n\nHẹn ở cổng trường, giờ có thể xê dịch tầm 10 phút. Ai đi thì mang mũ bảo hiểm với nhắn mình trước nhé, đủ người mình cập nhật bài luôn.",
    campus: "Quy Nhơn",
    location: "Campus Quy Nhơn → trung tâm",
    tags: ["CònChỗ", "ĐiChung"],
    likesCount: 9,
  }),
  post(12, {
    authorId: "usr_student_01",
    lifeTopic: "housing",
    status: "PendingReview",
    visibility: "school",
    title: "Chuyển trọ xong mới thấy có nhiều thứ phải hỏi",
    contentMd:
      "Mình đang tổng hợp lại mấy khoản phải kiểm tra khi nhận phòng. Có ảnh giấy bàn giao nên chờ duyệt thêm chút.",
  }),
  post(13, {
    authorId: "usr_student_01",
    lifeTopic: "campus",
    status: "Rejected",
    visibility: "school",
    title: "Có bạn nào rơi thẻ ở sân trường không?",
    contentMd:
      "Mình gửi thẻ ở quầy hỗ trợ sinh viên rồi nha, bạn nào mất ghé hỏi thử nhé.",
    rejectReason:
      "Ảnh ban đầu chứa mã sinh viên và thông tin cá nhân. Vui lòng che thông tin trước khi gửi lại.",
  }),
];

export const seedComments: Comment[] = [
  {
    id: "cmt_01",
    postId: "post_01",
    authorId: "usr_student_07",
    content:
      "Thêm giờ đóng cổng nữa b ơi. Mình toàn học nhóm về muộn, suýt quên hỏi khoản này.",
    likesCount: 8,
    createdAt: "",
  },
  {
    id: "cmt_02",
    postId: "post_02",
    authorId: "usr_student_03",
    content:
      "Mình chia tiền ăn theo tuần trước, tầm đó cơm/bún luân phiên vẫn ổn. Bữa nào mệt thì mua sẵn, đừng ép tự chuẩn bị hết. Đồ nấu trong ktx nhớ hỏi quy định khu mình nha.",
    isAcceptedAnswer: true,
    likesCount: 9,
    createdAt: "",
  },
  {
    id: "cmt_03",
    postId: "post_02",
    authorId: "usr_student_01",
    parentId: "cmt_02",
    content:
      "Cảm ơn b, để mình thử chia tiền theo tuần chứ đầu tháng tiêu hơi hăng 🥲",
    likesCount: 2,
    createdAt: "",
  },
  {
    id: "cmt_04",
    postId: "post_04",
    authorId: "usr_student_09",
    content:
      "Trứng cà chua cứu cánh luôn, một chảo là xong. Nhớ để lửa nhỏ nha, mình từng làm thành trứng cháy :))",
    likesCount: 4,
    createdAt: "",
  },
  {
    id: "cmt_05",
    postId: "post_07",
    authorId: "usr_student_02",
    content:
      "Có nha, hồi đầu mình cũng vậy. Cứ nhắn “trưa nay ăn cùng không” thôi, nhiều khi bạn kia cũng đang ngại giống mình á.",
    likesCount: 12,
    createdAt: "",
  },
  {
    id: "cmt_06",
    postId: "post_06",
    authorId: "usr_student_01",
    content: "Cái phí giao hàng + món gọi thêm để đủ đơn là bẫy thật =)))",
    likesCount: 3,
    createdAt: "",
  },
  {
    id: "cmt_07",
    postId: "post_14",
    authorId: "usr_student_01",
    content:
      "Nếu chỉ ăn giữa hai ca thì mình sẽ tính riêng tiền bánh với tiền nước, chứ gọi cả hai dễ vượt mức 30k á.",
    likesCount: 4,
    createdAt: "",
  },
  {
    id: "cmt_08",
    postId: "post_14",
    authorId: "usr_student_03",
    parentId: "cmt_07",
    content:
      "Chuẩn, mình cũng đang tính phần bánh thôi. Để hỏi thêm bạn nào đã mua trực tiếp rồi mới chốt.",
    likesCount: 2,
    createdAt: "",
  },
  {
    id: "cmt_09",
    postId: "post_15",
    authorId: "usr_student_07",
    content:
      "Nhớ xem tổng tiền trước khi đặt nha, phí giao với món thêm dễ làm quá budget lắm.",
    likesCount: 3,
    createdAt: "",
  },
  {
    id: "cmt_10",
    postId: "post_16",
    authorId: "usr_student_08",
    content:
      "Mình cũng cần ổ cắm 😭 Khi chốt chi nhánh bạn hỏi quán trước rồi báo nhóm nha, đừng mặc định chỗ nào cũng có.",
    likesCount: 5,
    createdAt: "",
  },
];
seedComments.forEach((comment, index) => {
  const original = seedKnowledgePosts.find(
    (item) => item.id === comment.postId,
  )!;
  comment.createdAt = new Date(
    Math.min(
      Date.now() - 60_000,
      Date.parse(original.createdAt) + (index + 1) * 60_000,
    ),
  ).toISOString();
});
seedKnowledgePosts.forEach((item) => {
  item.commentCount = seedComments.filter(
    (comment) => comment.postId === item.id,
  ).length;
});
