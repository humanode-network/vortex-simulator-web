import "./MainAtmosphere.css";

const petals = Array.from({ length: 14 }, (_, index) => index + 1);
const stars = Array.from({ length: 28 }, (_, index) => index + 1);
const galaxies = Array.from({ length: 3 }, (_, index) => index + 1);
const smokePlumes = Array.from({ length: 5 }, (_, index) => index + 1);
const cinders = Array.from({ length: 16 }, (_, index) => index + 1);

const skyClouds = [
  {
    id: 1,
    fill: "M28 74 C48 48 78 48 95 68 C103 35 142 22 170 45 C187 18 231 18 250 51 C274 34 313 44 321 76 C348 66 382 76 394 101 C334 110 262 107 207 108 C145 109 85 105 28 100 Z",
    wash: "M20 88 C80 44 137 34 196 45 C255 56 305 59 402 93 C319 121 127 122 20 105 Z",
    top: "M35 82 C54 51 82 50 98 69 C106 34 144 24 169 47 C187 18 229 19 250 51 C275 35 309 47 320 76 C344 68 374 75 391 99",
    base: "M28 100 C90 106 145 109 207 108 C263 107 333 110 394 101",
    curls: [
      "M112 78 C132 60 159 65 161 84 C163 100 139 101 132 88",
      "M233 75 C254 58 284 63 287 84 C289 103 262 105 252 90",
    ],
    under: ["M71 95 C104 87 133 91 158 99", "M296 96 C322 88 353 91 377 100"],
  },
  {
    id: 2,
    fill: "M36 78 C50 58 78 55 94 72 C100 44 130 31 154 50 C169 34 202 35 217 59 C241 47 275 54 285 80 C312 74 342 84 358 105 C303 111 239 110 182 111 C125 112 77 108 36 101 Z",
    wash: "M30 86 C88 48 142 42 199 53 C246 62 300 69 365 98 C304 118 110 119 30 105 Z",
    top: "M43 81 C57 58 78 56 94 72 C101 42 130 32 154 51 C171 34 202 36 217 60 C241 48 275 56 286 80 C312 74 342 84 358 105",
    base: "M36 101 C84 108 126 112 182 111 C241 110 303 111 358 105",
    curls: [
      "M103 82 C119 70 139 74 141 89 C142 101 123 103 117 92",
      "M218 81 C235 68 258 73 260 89 C261 103 240 104 233 92",
    ],
    under: ["M58 98 C83 91 109 93 132 101", "M271 101 C296 94 324 96 349 105"],
  },
  {
    id: 3,
    fill: "M22 80 C48 46 90 54 107 78 C119 35 172 18 205 51 C224 27 267 33 279 69 C308 52 359 64 390 103 C335 119 250 115 197 116 C123 117 64 112 22 101 Z",
    wash: "M18 91 C92 45 152 35 225 49 C293 62 345 73 399 101 C314 128 101 128 18 107 Z",
    top: "M31 82 C50 51 89 55 108 79 C121 36 170 21 205 52 C225 28 266 35 279 69 C310 53 357 65 390 103",
    base: "M22 101 C82 111 123 117 197 116 C253 115 336 119 390 103",
    curls: [
      "M126 81 C151 57 187 65 188 88 C189 109 157 108 148 92",
      "M284 82 C306 67 337 72 344 92 C350 109 326 114 314 99",
    ],
    under: ["M72 98 C101 88 132 92 162 103", "M218 103 C254 91 291 94 329 106"],
  },
  {
    id: 4,
    fill: "M45 74 C61 54 91 53 105 73 C111 47 143 37 163 56 C178 39 210 43 222 68 C246 58 282 70 302 99 C252 108 190 106 145 107 C99 108 66 104 45 96 Z",
    wash: "M40 84 C91 54 137 47 183 55 C230 64 267 73 307 96 C248 116 92 116 40 103 Z",
    top: "M51 78 C65 56 92 54 105 73 C112 47 143 38 164 56 C179 40 210 44 222 68 C246 59 282 71 302 99",
    base: "M45 96 C78 104 100 108 145 107 C191 106 253 108 302 99",
    curls: [
      "M110 79 C125 67 145 70 147 85 C149 99 128 101 123 90",
      "M211 78 C229 67 252 73 254 89 C255 103 235 103 228 91",
    ],
    under: ["M68 94 C92 88 113 90 136 98", "M231 97 C252 91 275 93 295 101"],
  },
];

const MainAtmosphere: React.FC = () => {
  return (
    <div className="main-atmosphere" aria-hidden="true">
      <div className="main-atmosphere__theme main-atmosphere__sky">
        {skyClouds.map((cloud) => (
          <svg
            className={`main-atmosphere__cloud main-atmosphere__cloud--${cloud.id}`}
            key={cloud.id}
            viewBox="0 0 420 132"
            focusable="false"
          >
            <path className="main-atmosphere__cloud-wash" d={cloud.wash} />
            <path className="main-atmosphere__cloud-fill" d={cloud.fill} />
            <path
              className="main-atmosphere__cloud-line main-atmosphere__cloud-line--top"
              d={cloud.top}
            />
            <path
              className="main-atmosphere__cloud-line main-atmosphere__cloud-line--base"
              d={cloud.base}
            />
            {cloud.curls.map((curl) => (
              <path
                className="main-atmosphere__cloud-line main-atmosphere__cloud-line--curl"
                d={curl}
                key={curl}
              />
            ))}
            {cloud.under.map((under) => (
              <path
                className="main-atmosphere__cloud-line main-atmosphere__cloud-line--under"
                d={under}
                key={under}
              />
            ))}
          </svg>
        ))}
      </div>

      <div className="main-atmosphere__theme main-atmosphere__light">
        {petals.map((petal) => (
          <span
            className={`main-atmosphere__petal main-atmosphere__petal--${petal}`}
            key={petal}
          />
        ))}
      </div>

      <div className="main-atmosphere__theme main-atmosphere__night">
        {stars.map((star) => (
          <span
            className={`main-atmosphere__star main-atmosphere__star--${star}`}
            key={star}
          />
        ))}
        {galaxies.map((galaxy) => (
          <span
            className={`main-atmosphere__galaxy main-atmosphere__galaxy--${galaxy}`}
            key={galaxy}
          >
            <b />
            <b />
            <b />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        ))}
      </div>

      <div className="main-atmosphere__theme main-atmosphere__fire">
        <span className="main-atmosphere__campfire-glow" />
        {smokePlumes.map((plume) => (
          <span
            className={`main-atmosphere__smoke main-atmosphere__smoke--${plume}`}
            key={plume}
          />
        ))}
        {cinders.map((cinder) => (
          <span
            className={`main-atmosphere__cinder main-atmosphere__cinder--${cinder}`}
            key={cinder}
          />
        ))}
      </div>
    </div>
  );
};

export default MainAtmosphere;
