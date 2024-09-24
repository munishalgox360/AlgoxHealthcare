const FEEDS_DATA = [
    {
        id: 1,
        feedType: "video",
        feedTitle: "What is Transcranial Magnetic Stimulation (rTMS)?",
        feedDescription: "rTMS is a noninvasive procedure that modulates neurons in the brain via electromagnetic induction. However, the word repetitive in rTMS is a misnomer since it can also be used in single pulses. It is not necessarily transcranial and can modulate neurons on any accessible body part. It is also electromagnetic rather than magnetic in nature and has the power to inhibit neuronal tissue",
        feedLink: "https://www.youtube.com/watch?v=wCQWFuG3ZBY"
    },
    {
        id: 2,
        feedType: "timesofindia",
        feedTitle: "Mental health struggle and tips to overcome from anxiety and nervousness during board exams",
        feedDescription: "Exam anxiety also known as performance anxiety is a state of fear, apprehension, uneasiness, or panic that can occur before, during, or after an exam. It hinders learning and impairs working memory.",
        feedLink: "https://timesofindia.indiatimes.com/blogs/voices/mental-health-struggle-and-tips-to-overcome-from-anxiety-and-nervousness-during-board-exams/"
    },
    {
        id: 3,
        feedType: "video",
        feedTitle: "What is Obsessive Compulsive Disorder?",
        feedDescription: "Obsessive-compulsive disorder is a common psychiatric disorder, the main features of which are obsessions and compulsions. It's one of the four most common psychiatric disorders with a lifetime prevalence of 1-3%. Sufferers of OCD can experience intrusive and distressing thoughts, rituals and compulsions that, can have a profound effect on their everyday life.",
        feedLink: "https://www.youtube.com/watch?v=wCQWFuG3ZBY"
    },
    {
        id: 4,
        feedType: "indianexpress",
        feedTitle: "Chronic stress can negatively effect your physical, mental health; here’s how to manage it effectively",
        feedDescription: "Stress is a physical, mental, and emotional response to a perceived threat or demand, Dr Samant Darshi, consultant psychiatrist, Psymate Healthcare & Yatharth Super-speciality Hospitals",
        feedLink: "https://indianexpress.com/article/lifestyle/health/5-easy-ways-to-cope-with-stress-exercise-yoga-meditation-sleep-balance-work-life-8266022/lite/"
    },
    {
        id: 5,
        feedType: "timesnow",
        feedTitle: "Overcoming exam anxiety: Experts tips to deal with exam stress, keep your mental health intact",
        feedDescription: "Mental health has been the most compromised during the COVID-19 pandemic. People of all age groups experienced some or the other symptoms of mental health issues such as anxiety, depression, chronic stress and others. With schools closed, classes being conducted online, and exams postponed due to the pandemic, many students",
        feedLink: "https://www.timesnownews.com/health/article/overcoming-exam-anxiety-experts-tips-to-deal-with-exam-stress-keep-your-mental-health-intact/722396"
    },
    {
        id: 6,
        feedType: "news18",
        feedTitle: "Exercise and Foods To Enhance Attention Span",
        feedDescription: "Attention span tends to decline with age, especially in older adults, and can be affected by mental health conditions like ADHD, anxiety, depression, and stress",
        feedLink: "https://www.news18.com/amp/news/lifestyle/exercise-and-foods-to-enhance-attention-span-6991255.html"
    },
    {
        id: 7,
        feedType: "indiatoday",
        feedTitle: "Rise in teen aggression, deaths by suicide over minor issues. Experts explain",
        feedDescription: "To combat this distressing trend, it is imperative for society to be vigilant for warning signs, including abrupt changes in behavior, withdrawal, and loss of interest in activities they once enjoyed.",
        feedLink: "https://www.indiatoday.in/education-today/featurephilia/story/rise-in-teen-aggression-deaths-by-suicide-over-minor-issues-experts-explain-2412533-2023-07-27"
    },
    {
        id: 8,
        feedType: "ndtv",
        feedTitle: "Diabetes: Stress Can Make It Hard For You To Control Blood Sugar Levels, Expert Explains How",
        feedDescription: "It is crucial for a diabetic to maintain healthy blood sugar levels. If left uncontrolled, diabetes can lead to some severe complications. You might have come across several theories around a perfect diet plan for people with diabetes. Many usually focus on the impact of the foods they consume on their blood sugar levels. But diet is not the only factor that diabetics should focus on",
        feedLink: "https://www.indiatoday.in/education-today/featurephilia/story/rise-in-teen-aggression-deaths-by-suicide-over-minor-issues-experts-explain-2412533-2023-07-27"
    },
    {
        id: 9,
        feedType: "music",
        feedTitle: "",
        feedDescription: "",
        feedLink: ""
    },
    {
        id: 10,
        feedType: "podcast",
        feedTitle: "",
        feedDescription: "",
        feedLink: ""
    }
]

const BANNERS = [
    {
        id: 1,
        bannerUrl: 'https://ik.imagekit.io/jybala7h3/banner%201_EoutIN5TW7.png?updatedAt=1705924742050',
        status:'active'
    },
    {
        id: 2,
        bannerUrl: 'https://ik.imagekit.io/jybala7h3/Group%2030094_pPal_75DQ0.png?updatedAt=1705924742244',
        status:'active'
    }
]

module.exports = { FEEDS_DATA, BANNERS };