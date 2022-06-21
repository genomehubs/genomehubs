// const analysisSuggestQuery = ({ searchTerm }) => {
//   return {};
// };

// const assemblySuggestQuery = ({ searchTerm }) => {
//   return {
//       text: searchTerm,
//       simple_phrase: {
//         phrase: {
//           field: "identifiers.identifier.trigram",
//           size: "{{suggestSize}}{{^suggestSize}}3{{/suggestSize}}",
//           gram_size: "{{gramSize}}{{^gramSize}}3{{/gramSize}}",
//           confidence: "{{confidence}}{{^confidence}}1{{/confidence}}",
//           max_errors: "{{maxErrors}}{{^maxErrors}}2{{/maxErrors}}",
//           direct_generator: [
//             {
//               "field": "identifiers.identifier.trigram",
//               "suggest_mode": "always"
//             },
//             {
//               "field": "identifiers.identifier.reverse",
//               "suggest_mode": "always",
//               "pre_filter": "reverse",
//               "post_filter": "reverse"
//             }
//           ],
//           highlight: {
//             pre_tag: preTag,
//             post_tag: postTag
//           },
//           collate: {
//             query: {
//               source: {
//                 match_phrase: {
//                   ["identifiers.identifier"]: "{{suggestion}}"
//                 }
//               }
//             },
//             prune: true
//           }
//         }
//       }
//     }
//   };
// };

// const taxonSuggestQuery = ({
//   searchTerm,
//   suggestSize = 3,
//   gramSize = 3,
//   confidence = 1,
//   maxErrors = 3,
//   preTag = "<em>",
//   postTag = "</em>",
// }) => {
//   return {
//     text: searchTerm,
//     simple_phrase: {
//       phrase: {
//         field: "taxon_names.name.trigram",
//         size: suggestSize,
//         gram_size: gramSize,
//         confidence: confidence,
//         max_errors: maxErrors,
//         direct_generator: [
//           {
//             field: "taxon_names.name.trigram",
//             suggest_mode: "always",
//           },
//           {
//             field: "taxon_names.name.reverse",
//             suggest_mode: "always",
//             pre_filter: "reverse",
//             post_filter: "reverse",
//           },
//         ],
//         highlight: {
//           pre_tag: preTag,
//           post_tag: postTag,
//         },
//         collate: {
//           query: {
//             source: {
//               match_phrase: {
//                 ["taxon_names.name"]: "{{suggestion}}",
//               },
//             },
//           },
//           prune: true,
//         },
//       },
//     },
//   };
// };

const genericSuggestQuery = ({
  field,
  searchTerm,
  suggestSize = 3,
  gramSize = 3,
  confidence = 1,
  maxErrors = 3,
  preTag = "<em>",
  postTag = "</em>",
}) => {
  return {
    text: searchTerm,
    simple_phrase: {
      phrase: {
        field: `${field}.trigram`,
        size: suggestSize,
        gram_size: gramSize,
        confidence: confidence,
        max_errors: maxErrors,
        direct_generator: [
          {
            field: `${field}.trigram`,
            suggest_mode: "always",
          },
          {
            field: `${field}.trigram`,
            suggest_mode: "always",
            pre_filter: "reverse",
            post_filter: "reverse",
          },
        ],
        highlight: {
          pre_tag: preTag,
          post_tag: postTag,
        },
        collate: {
          query: {
            source: {
              match_phrase: {
                [field]: "{{suggestion}}",
              },
            },
          },
          prune: true,
        },
      },
    },
  };
};

export const suggestQuery = ({ result, ...params }) => {
  let suggest = {};
  if (result == "assembly" || result == "feature" || result == "sample") {
    suggest = genericSuggestQuery({
      ...params,
      field: "identifiers.identifier",
    });
  } else if (result == "taxon") {
    suggest = genericSuggestQuery({ ...params, field: "taxon_names.name" });
  }
  return {
    suggest,
  };
};
