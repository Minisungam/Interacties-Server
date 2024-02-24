export default class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(element) {
    this.items.push(element);
  }

  dequeue() {
    return this.items.shift();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  front() {
    return this.items[0];
  }

  size() {
    return this.items.length;
  }

  print() {
    console.log(this.items.toString());
  }
}
