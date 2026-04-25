const r = "Hello Alice, thank you. I'm Bob. How are you?";
const sentences = r.match(/[^.!?]+[.!?]*/g) || [];
console.log(sentences);
